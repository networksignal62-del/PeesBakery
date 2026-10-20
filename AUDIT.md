# Pee's Bakery release audit

Checked on 18–19 October 2026. This records the local release candidate in the
`PeesBakery` repository and its matching staff panel in `Peesbakery-admin`.
It does not certify the current live deployment or the real Supabase project.

## Delivered in the source

- The customer app serves the staff panel under `/admin` on the same Next.js
  deployment. The standalone admin repository keeps the panel source in sync.
- Owner, admin, manager, staff, and waiter roles have separate page, navigation,
  API, and database permissions. The owner can invite, disable, and change staff
  roles. Staff can change their own password after entering the current one.
- Staff and waiters have a searchable digital menu with active items, variants,
  add-ons, prices, and a link to the customer menu. The public menu reads active
  products from Supabase.
- Guest checkout sends the cart to a database function that recalculates prices,
  validates items, and creates a pending order with an initial status entry.
  Status changes and notes have a separate authorized function and history.
  The interface makes no claim of an automatic payment confirmation or SMS.
- General WhatsApp (+232 78 891638), checkout WhatsApp (+232 33 680260),
  and order calls (+232 75 361494) retain their distinct purposes and settings.
- Public pages have titles, descriptions, canonicals, social metadata, an icon,
  a generated Open Graph image, robots rules, a sitemap, a 404 page, and loading,
  empty, and error states. Cart, checkout, wishlist, and admin are excluded from
  indexing. Product pages use the product image and description when available.
  Unused default V0 icon assets were removed; the favicon uses bakery branding.
- The anonymous payment upload endpoint and unused admin server actions were
  removed. Staff APIs check active role and same origin. Image uploads check
  role, count, size, type, and file signature. Security headers include a limited
  Content Security Policy for framing, object embeds, and base URLs.

## Verified locally

- `pnpm build` in the customer repository and `npm run build` in the admin
  repository completed on Next.js 16.4.2. TypeScript passed as part of both
  builds. Node.js 22 or newer is required by the current Supabase clients.
- `pnpm lint` and `npm run lint -- --quiet` completed with zero errors after the
  dependency update. React effect/dependency and image optimization warnings
  remain. React Compiler is not enabled; its effect and declaration diagnostics
  remain warnings in the lint configuration. Address them before enabling it.
- `node scripts/qa-database.mjs` used disposable local PostgreSQL (PGlite),
  applied the migration twice, and checked atomic catalog/settings rollback,
  role restrictions, guest price tamper rejection, valid order totals, and
  authorized status history. This is not a test against the real Supabase schema.
- After the Next.js update, `node scripts/qa-browser.mjs` checked `/`, `/menu`, `/about`, `/contact`,
  `/cart`, `/wishlist`, and the 404 route in production mode at 320, 390, 768,
  1024, and 1440 CSS pixels. Those runs found no horizontal overflow or broken
  images, no images lacking an `alt` attribute, one main heading per page, and no
  application console errors. The
  expected missing-resource message on the 404 route was excluded.
- `node scripts/qa-interactions.mjs` checked the mobile menu toggle, contact
  WhatsApp draft, and the 404 recovery link. WhatsApp was stubbed; no message
  was sent. The public SEO routes responded with HTTP 200. With no Supabase
  configuration, `/admin` returned HTTP 503 and the staff API denied access.
- `node scripts/qa-bundle.mjs` measured 166 KB of compressed JavaScript on the
  homepage and 176 KB on the other tested public pages, with a 70 KB largest
  chunk, in this local build.
- Production dependency audits after the update reported **zero high or
  critical findings** in both repositories. The customer audit still reported
  one low and one moderate finding; the admin production audit reported zero.
  Full audits including development tooling reported eight high findings in the
  customer repository and five in the admin repository. Several are in the
  Next.js ESLint toolchain; npm's proposed major-version downgrade was not
  applied. Recheck these before further dependency upgrades.

## Hosted build (19 October 2026)

- The clean `651ff83` customer checkout was deployed from local source to the
  new Vercel project `alhassanojoekoromas-projects/pees-bakery-site`.
  Deployment `dpl_ByUmfqFwMqyF3vQivBxBHysQP55x` is READY and is aliased at
  `https://pees-bakery-site.vercel.app`. The project is not Git-connected;
  future source changes need an explicit deployment until Git linking is set up.
- Vercel's Next.js build and TypeScript passed. `/`, `/menu`, `/robots.txt`,
  `/sitemap.xml`, and `/opengraph-image` returned HTTP 200. `/admin` and
  `/admin/login` returned HTTP 503 without Supabase configuration, as intended.
- Hosted browser checks at 320, 390, 768, 1024, and 1440 CSS pixels found no
  horizontal overflow or missing image alt text, and one main heading on each
  tested public page. Direct asset requests and follow-up image decoding passed;
  a few initial 1.5-second samples were still loading large images. Mobile
  navigation, the unsent WhatsApp draft, and the 404 recovery link passed.
- `NEXT_PUBLIC_SITE_URL` is set to the Vercel alias for testing. The three
  Supabase variables are not configured. `peesbakery.rest` still serves its
  prior Vercel deployment; the new project has not been attached to that domain.

## Required before production release

1. GitHub collaborator write access to both repositories is confirmed. Enable
   the connected GitHub app for both repositories under the `networksignal62-del`
   owner account to open the review requests. The new Vercel project is hosted,
   but the connected Supabase account still does not show the bakery project.
   After database checks pass, attach `peesbakery.rest` to the new Vercel project
   and smoke-test `/admin`, `/menu`, `/robots.txt`, and `/sitemap.xml` on the
   actual domain.
2. Rotate the Supabase service-role key and password previously exposed in the
   public admin repository's Git history. Removing source files does not revoke
   those credentials. Do not put replacement secrets in Git or chat.
3. Back up the real Supabase database and review its current schema before
   applying `scripts/002_staff_roles_and_safe_orders.sql`. The migration changes
   policies, grants, functions, constraints, and role values. Confirm that the
   existing data meets its constraints. Confirm the `images` storage bucket
   serves public product images and restricts writes to the server upload path.
4. Create the owner's Supabase Auth user and active `super_admin` profile using
   the actual Auth user ID. Add the three missing production Supabase environment
   variables, redeploy, and configure Auth email delivery and redirect URLs as
   described in `README.md`.
5. Test real owner invitation, password change, manager/staff/waiter access,
   order creation and status changes, image upload, checkout WhatsApp handoff,
   and phone/tablet/laptop layouts with the live database. Local no-data checks
   do not establish those integrations.

The earlier public deployment was observed serving `/admin` and `/menu`, while
`/robots.txt` and `/sitemap.xml` returned 404. Those routes now respond on the
new Vercel alias, but the custom domain still needs a cutover and smoke test.

## Follow-up on 20 October 2026

- Draft PR #7 is still open and unmerged. The new `pees-bakery-site` Vercel
  project has the URL for the connected `PeesbakeryRestorant` Supabase project.
  Its configured publishable key was not registered for that project; it was
  replaced with the project's active publishable key and verified by comparing
  the values. The site now accepts this key under
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, while retaining the legacy anon-key
  variable as a fallback. Server code also accepts `SUPABASE_SECRET_KEY` or the
  legacy service-role variable.
- Neither server secret variable is set on that Vercel project. The environment
  update did not create a new deployment: `https://pees-bakery-site.vercel.app/admin`
  still returns HTTP 503. Do not treat the local smoke test as a hosted release.
- Both application builds and TypeScript checks passed after the key-name change.
  With the active publishable key, a local production-mode browser loaded 33
  menu items at 390 and 1440 CSS pixels, rendered `/admin/login`, and redirected
  an unauthenticated `/admin` visit to login. One 1440-pixel menu load exceeded
  a 20-second wait; a follow-up run passed. Authenticated staff flows and order
  writes were not tested against production.
- Read-only database preflight found one active owner profile, zero invalid
  roles, zero unmapped product categories, zero out-of-range catalog prices,
  and zero duplicate variant or add-on names. The `images` bucket exists and
  is public. The database still records only its original migration and none
  of the three required public RPCs. No migration was applied.
- The Supabase dashboard redirected to sign-in, so a restorable backup is still
  unverified. Database-password rotation is also unverified. Keep PR #7 in
  draft until the backup, rotation, migration, server secret, and live role and
  order checks are complete.
