import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Ephemeral PostgreSQL check. This never connects to Supabase or production data.
const db = new PGlite()
try {
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
  `)
  await db.exec(await readFile(new URL('./001_create_tables.sql', import.meta.url), 'utf8'))
  await db.query("INSERT INTO public.products(name, category, price, is_active) VALUES ('Migration check item', 'Bakery & Cakes', 10, true)")
  const migration = await readFile(new URL('./002_staff_roles_and_safe_orders.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  await db.exec(migration)
  const migrated = await db.query("SELECT id, category FROM public.products WHERE name = 'Migration check item'")
  assert.equal(migrated.rows[0].category, 'bakery')
  const productId = migrated.rows[0].id

  const ownerId = '00000000-0000-4000-8000-000000000001'
  const waiterId = '00000000-0000-4000-8000-000000000002'
  await db.query('INSERT INTO auth.users(id) VALUES ($1),($2)', [ownerId, waiterId])
  await db.query("INSERT INTO public.admin_profiles(id,email,role,is_active) VALUES ($1,'owner@example.invalid','super_admin',true),($2,'waiter@example.invalid','waiter',true)", [ownerId, waiterId])

  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${ownerId}';`)
  const saved = await db.query('SELECT public.save_catalog_product($1,$2::jsonb,$3::jsonb,$4::jsonb) AS id', [
    productId,
    JSON.stringify({ name: 'Migration check item', category: 'bakery', price: 10, image: null, description: null, long_description: null, featured: false, is_active: true, is_customizable: false }),
    JSON.stringify([{ name: 'Large', price: 20 }]),
    JSON.stringify([{ name: 'Gift box', price: 3 }]),
  ])
  assert.equal(saved.rows[0].id, productId)
  await assert.rejects(db.query('SELECT public.save_catalog_product($1,$2::jsonb,$3::jsonb,$4::jsonb)', [
    productId,
    JSON.stringify({ name: 'Changed name', category: 'bakery', price: 10 }),
    JSON.stringify([{ name: 'Other option', price: 30 }]),
    JSON.stringify([{ name: 'Invalid', price: -1 }]),
  ]))
  const afterRollback = await db.query('SELECT name FROM public.products WHERE id = $1', [productId])
  assert.equal(afterRollback.rows[0].name, 'Migration check item')
  const optionsAfterRollback = await db.query('SELECT name FROM public.product_variants WHERE product_id = $1', [productId])
  assert.deepEqual(optionsAfterRollback.rows.map(row => row.name), ['Large'])
  await assert.rejects(db.query('SELECT public.save_public_settings($1::jsonb)', [JSON.stringify({ address: 'Changed address', delivery_fee: '-1' })]))
  const addressAfterRollback = await db.query("SELECT value FROM public.site_settings WHERE key = 'address'")
  assert.equal(addressAfterRollback.rows[0].value, '90A Regent Road, Old School Junction, Freetown, Sierra Leone')
  await db.query('SELECT public.save_public_settings($1::jsonb)', [JSON.stringify({ opening_hours: 'Call for opening hours' })])
  await assert.rejects(db.query("UPDATE public.site_settings SET value = 'tampered' WHERE key = 'address'"))

  await db.exec(`SET request.jwt.claim.sub = '${waiterId}';`)
  await assert.rejects(db.query('SELECT public.save_catalog_product($1,$2::jsonb,$3::jsonb,$4::jsonb)', [
    null, JSON.stringify({ name: 'Denied item', category: 'bakery', price: 1 }), '[]', '[]',
  ]), /Catalog access required/)
  await assert.rejects(db.query('SELECT public.save_public_settings($1::jsonb)', [JSON.stringify({ opening_hours: 'Denied' })]), /Settings access required/)
  await db.exec('RESET ROLE;')

  const orderArgs = [
    'Test Customer', '+232 78 123456', '10 Test Road, Freetown', 'delivery', 'cash', null, null,
    JSON.stringify([{ productId, quantity: 2, variantName: 'Large', addons: [{ name: 'Gift box' }] }]),
  ]
  await db.exec('SET ROLE anon;')
  await assert.rejects(db.query("INSERT INTO public.orders(customer_name,customer_phone,delivery_method,payment_method,subtotal,total) VALUES ('x','1234567','pickup','cash',1,1)"))
  await assert.rejects(db.query('SELECT public.place_order($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)', [...orderArgs, 1]), /Prices changed/)
  const validOrder = await db.query('SELECT public.place_order($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) AS receipt', [...orderArgs, 66])
  assert.equal(Number(validOrder.rows[0].receipt.total), 66)
  await db.exec('RESET ROLE;')
  const staffId = '00000000-0000-4000-8000-000000000003'
  await db.query('INSERT INTO auth.users(id) VALUES ($1)', [staffId])
  await db.query("INSERT INTO public.admin_profiles(id,email,role,is_active) VALUES ($1,'staff@example.invalid','staff',true)", [staffId])
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${waiterId}';`)
  const waiterOrders = await db.query('SELECT count(*) AS count FROM public.orders')
  assert.equal(Number(waiterOrders.rows[0].count), 0)
  await db.exec(`SET request.jwt.claim.sub = '${staffId}';`)
  const staffOrders = await db.query('SELECT count(*) AS count FROM public.orders')
  assert.equal(Number(staffOrders.rows[0].count), 1)
  await assert.rejects(db.query('UPDATE public.orders SET total = 1 WHERE id = $1', [validOrder.rows[0].receipt.id]))
  await assert.rejects(db.query("UPDATE public.orders SET status = 'confirmed' WHERE id = $1", [validOrder.rows[0].receipt.id]))
  await db.query("SELECT public.set_order_status($1, 'confirmed', 'Checked by staff')", [validOrder.rows[0].receipt.id])
  await db.exec('RESET ROLE;')
  const counts = await db.query('SELECT (SELECT count(*) FROM public.orders) AS orders, (SELECT count(*) FROM public.order_status_history) AS events')
  assert.equal(Number(counts.rows[0].orders), 1)
  assert.equal(Number(counts.rows[0].events), 2)
  const latestEvent = await db.query('SELECT status, note FROM public.order_status_history ORDER BY id DESC LIMIT 1')
  assert.deepEqual(latestEvent.rows[0], { status: 'confirmed', note: 'Checked by staff' })
  console.log('Database migration and repeat, catalog rollback, staff roles, order price check, and status history passed in ephemeral PostgreSQL.')
} finally {
  await db.close()
}
