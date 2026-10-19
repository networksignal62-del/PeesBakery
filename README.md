# Pee's Bakery & Restaurant

This Next.js application serves the customer website at `https://peesbakery.rest` and the staff panel at `https://peesbakery.rest/admin`. The separate [Peesbakery-admin repository](https://github.com/networksignal62-del/Peesbakery-admin) contains the panel source, but the customer repository is the deployment target for the shared domain. Keep panel changes synchronized between the repositories until they are consolidated.

## Local setup

Use Node.js 22 or newer and pnpm. Supabase's client libraries no longer support Node.js 20.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
pnpm build
```

Copy `.env.example` to `.env.local` and fill in your own Supabase project values. Never commit `.env.local`, a service-role key, or a staff password.

## Required release order

1. Rotate the Supabase service-role key and any password previously embedded in the public admin repository. Removing those files in a new commit does not erase Git history.
2. Back up the Supabase database. On a new database, run `scripts/001_create_tables.sql`; on the existing database, review its current schema. Apply `scripts/002_staff_roles_and_safe_orders.sql` before deploying this code. The migration replaces existing policies, adds staff roles, and makes guest order totals database-calculated.
3. In Supabase Auth, create the bakery owner's user and add a corresponding `admin_profiles` row with `role = 'super_admin'` and `is_active = true`. Use the real Auth user ID. Do not put an owner password in SQL or source files.
4. Configure `https://peesbakery.rest/admin/welcome` in Supabase Auth's allowed redirect URLs. Configure production email delivery for staff invitations.
5. Point `peesbakery.rest` at the Vercel project deploying **this** repository, set the environment variables below, and deploy. The old separate admin deployment is not needed for the `/admin` path.
6. Test checkout, WhatsApp handoff, owner invitation, waiter access, password change, and role restrictions against the deployed URL before announcing the release.

Required Vercel environment variables:

| Name | Scope |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; required for staff invitations and product image uploads |
| `NEXT_PUBLIC_SITE_URL` | `https://peesbakery.rest` |

The public menu reflects active products in Supabase. General WhatsApp, checkout WhatsApp, and order calls have separate settings and retain their current numbers.

## Staff roles

| Role | Access |
| --- | --- |
| Owner (`super_admin`) | Staff accounts, catalog, settings, orders, digital menu |
| Admin / Manager | Catalog, settings, orders, digital menu |
| Staff | Orders and digital menu |
| Waiter | Digital menu and their own account |

The panel's **My account** page changes a signed-in employee's password. New employees accept an email invitation at `/admin/welcome` and choose their own password.

See [AUDIT.md](AUDIT.md) for verification evidence and remaining release checks.
