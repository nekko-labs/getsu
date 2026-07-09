# Marketing site

A single, self-contained static landing page for Getsu (`index.html`, no build step, inline CSS/JS, moon + warm-paper design language matching the app). Heavy whitespace, the crescent-moon-and-cat mark with an opening animation, and one calm CTA into the app.

## How it ships

The whole repo deploys as **one Vercel project** (`getsu.app`) via the combined build in [`scripts/build-site.mjs`](../../scripts/build-site.mjs):

- `/` → this landing page (`apps/site/*`)
- `/app/` → the local-first app (`apps/web/dist`; Vite `base: './'` so it runs under a subpath)

See the repo [`DEPLOY.md`](../../DEPLOY.md) for the full deploy + domain setup.

## Local preview

```
npm run build:site        # assembles _site/ (landing at /, app at /app/)
npx serve _site           # or: python -m http.server -d _site 4181
```
