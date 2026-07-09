# Deploying Getsu

Getsu is **local-first**. The free tier needs no backend at all — it's a static site that stores everything in the browser. Cloud sync (the $2/mo tier) adds Supabase. Hosting is Vercel (the Nekko Labs default).

---

## 1. Host on Vercel (free tier works with zero backend)

The repo ships as **one Vercel project** at `getsu.app`. The combined build in
[`scripts/build-site.mjs`](scripts/build-site.mjs) assembles a single static output:

- `/` → the marketing landing page (`apps/site/`)
- `/app/` → the local-first app (`apps/web/dist`; Vite `base: './'` lets it run under a subpath, and it uses `HashRouter`, so no SPA rewrites are needed)

[`vercel.json`](vercel.json) is configured for this: build `npm run build:site`, output `_site`, `cleanUrls: true`.

**Option A — Vercel dashboard:**
1. Go to vercel.com → **Add New → Project** → import `nekko-labs/getsu`.
2. Vercel reads `vercel.json`. Leave the defaults.
3. Deploy, then add the domain `getsu.app` (and `gatsu.app` as a redirect to it) under **Settings → Domains**.

**Option B — CLI:**
```bash
npm i -g vercel
vercel link                 # link to the nekkolabs team project
vercel --prod               # production deploy
vercel domains add getsu.app
```

> Connecting the GitHub repo gives you automatic preview deploys on every PR and production deploys on merge to `main`.

---

## 2. Enable cloud sync (the paid tier) with Supabase

The app stays fully functional without this. Do it only when you want to offer sync.

1. **Create a Supabase project** at supabase.com (free tier is fine to start).
2. **Run the schema:** open the SQL editor and paste [`supabase/schema.sql`](supabase/schema.sql). It creates `profiles` + `vaults` with Row-Level Security and a trigger that gives every new user a `free` profile.
3. **Enable Email auth:** Authentication → Providers → Email → enable **magic link / OTP**. (Optionally add Google/Apple OAuth later; Apple is required for a native iOS app.)
4. **Get your keys:** Project Settings → API → copy the **Project URL** and the **anon public** key.
5. **Set env vars in Vercel** (Project → Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
   Redeploy. The **Account & sync** screen now offers magic-link sign-in.

> Locally, copy `apps/web/.env.example` → `apps/web/.env` and fill the same two values.

---

## 3. Turning on a user's Cloud plan

Sync is gated on `profiles.plan = 'cloud'`. Today that's enforced client-side; a new user is `free` by default.

- **To test as the owner:** in the Supabase table editor, set your own `profiles.plan` to `cloud`. Sign in on the Account screen → your vault syncs.
- **For real billing (later):** create a **Stripe** product at **$2/month**, add a Stripe payment link or Checkout, and a webhook that flips `profiles.plan` to `cloud` on `checkout.session.completed` (and back to `free` on cancellation). Re-verify the plan server-side (edge function / RLS join) before allowing writes for a hard paywall.

---

## What's free vs. what's paid

| | Free (local) | Cloud — $2/mo |
|---|---|---|
| All surfaces, unlimited entries/goals/trackers | ✅ | ✅ |
| Photos | on device | synced cloud storage |
| Analytics, year-in-review | ✅ | ✅ |
| Backup/export | local JSON | automatic encrypted cloud backup |
| Devices | this one | sync across all of them |
| Web access | self-host/deploy | hosted, any browser |
| Account required | no | yes |

Free is never crippled — sync is a convenience, not a hostage.

---

## Known follow-ups

- **Photos in the snapshot:** the MVP sync stores the whole vault (including photo data URLs) as one JSONB row. Before promoting cloud photos, move images to **Supabase Storage** (private bucket, path `user_id/...`, signed URLs) and keep only the path in the vault. Watch the free tier's storage/egress limits.
- **Per-record sync:** the current strategy is whole-vault last-write-wins (great for one user across devices). For shared/multi-user journals, split into per-entity tables with per-row `updated_at`.
- **Verify Supabase free-tier limits** at supabase.com/pricing before publishing plan copy.
