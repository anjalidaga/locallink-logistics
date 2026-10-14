# LocalLink Logistics (demo)
MBA Logistics & SCM project. **Fictional demo business** - not an operating delivery company. React + TypeScript + Vite + HashRouter + Recharts. The app supports browser-only demo mode and Supabase mode. In Supabase mode, bookings, phone-verified tracking, enquiries, and administrator order updates use the `locallink-api` Edge Function. No live GPS, payments, or real email sending.

## Connect Supabase

1. Run `supabase/migration_locallink.sql` in Supabase SQL Editor.
2. Deploy the `locallink-api` Edge Function. See `supabase/ADMIN_SETUP.md` for the commands and administrator setup.
3. Copy `.env.example` to `.env` and add the Supabase Project URL and publishable/anon key.
4. Restart the development server. The service-role key must only be used by Supabase Edge Functions, never in frontend files.

If the `.env` file is not configured, the site remains in local demo mode using browser storage and fictional seed orders.

## Run locally
```
npm install
npm run dev      # development
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## Demo workflow
Book (Book page) -> copy Order ID -> Track page (database orders require the booking phone number) -> Dashboard (KPIs, charts, table). In Supabase mode, an admin signs in to load database orders and persist status updates. "Reset Demo Data" on the Dashboard restores the 250-order seed.

## Where to change things
- `src/lib/pricing.ts` - services, prices, delivery windows, pricing rules (single source of truth)
- `src/lib/seed.ts` - initial dataset, names, areas, delivery partners
- `src/lib/config.ts` - company name, tagline, contact details, links
- `src/styles.css` - colours via CSS variables at the top

## Publish on GitHub Pages
1. Create a new **public** repository on github.com (e.g. `locallink-logistics`).
2. Upload everything in this folder (including the hidden `.github` folder) - either drag-and-drop on the repo page ("uploading an existing file") or:
   ```
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. Repo **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. Open the **Actions** tab; wait for "Deploy to GitHub Pages" to turn green (1-2 min).
5. Your site: `https://<you>.github.io/<repo>/`

### Repository name / base path
`vite.config.ts` uses a relative base (`./`), and HashRouter keeps routes after `#`, so **it works under any repository name with no changes**. If you prefer an absolute base, set it in the workflow's build step: `VITE_BASE=/<repo-name>/ npm run build` (or edit `base` in `vite.config.ts`).

## On-time delivery rate
Rate = delivered orders flagged `onTime` / all **Delivered** orders. Delayed and active orders are not yet completed, so they are excluded from the denominator. Orders moved to Delivered from Delayed are recorded as late.

## Limits
Enquiries are only saved in your browser; `mailto:` and `tel:` links open your own email/phone app.

## Database security note

Public website users can create bookings, submit enquiries, and look up a booking only when they provide its Order ID and booking phone number. The raw `orders`, `tracking_events`, and `enquiries` tables have no public read/write policies. Administrator listing and status updates require a Supabase Auth user whose `profiles.role` is `admin`.
