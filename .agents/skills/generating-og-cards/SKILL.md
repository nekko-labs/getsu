---
name: generating-og-cards
description: Generate branded 1200x630 Open Graph cards by composing generated artwork, real repository marks, copy, and installed fonts with Playwright. Use when adding or repairing social preview images for a marketing site.
---

# Generating branded OG cards

Use this skill for a marketing site that needs a branded Open Graph/Twitter card.
The workflow deliberately separates image generation from typography: image
models make attractive artwork but render literal text unreliably.

## Environment setup

Install the fonts into the user's font directory. The CSS API returns the
current Google Fonts files and the small script below downloads every referenced
font face:

```bash
mkdir -p /home/ubuntu/og/art /home/ubuntu/og/out
mkdir -p ~/.fonts
curl -fsSL -A 'Mozilla/5.0' \
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;700&display=swap' \
  > /tmp/og-google-fonts.css
grep -oE 'https://[^)]+' /tmp/og-google-fonts.css | while read -r url; do
  curl -fsSL "$url" -o "$HOME/.fonts/$(basename "${url%%\?*}")"
done
fc-cache -f
fc-match Inter
fc-match Fraunces
fc-match 'JetBrains Mono'
```

Install the renderer dependency beside `render.mjs`, where Node's module
resolution will actually find it. Installing only in the working directory is
not sufficient: Node resolves bare imports from the script's directory upward,
not from the current working directory. The checked-in `package.json` makes the
skill self-contained:

```bash
cd /home/ubuntu/repos/getsu/.agents/skills/generating-og-cards
npm install
npx playwright install chromium
# If the browser reports missing shared libraries:
# sudo npx playwright install --with-deps chromium
```

Do not point Playwright at a system Chrome executable; use its bundled browser.
For reference, from this skill directory the dependency should resolve with:

```bash
node -e "console.log(require.resolve('playwright'))"
```

## Two-stage workflow

### Stage 1: generate background artwork only

Use the image-generation tool at `1536x1024`. Ask for an illustration or
abstract product scene, **not** the final card and not any literal copy. The
prompt must:

- Name the exact repository palette hex values.
- Put the visual art in the **RIGHT third**.
- Explicitly reserve the **LEFT two-thirds** as empty negative space for the
  text block.
- Say that no text, lettering, logo, watermark, UI labels, or other copy should
  appear in the artwork.

Save one background image per project under `/home/ubuntu/og/art/`, for example
`/home/ubuntu/og/art/getsu-bg.png`. Keep the artwork itself free of text; the
renderer adds the real copy later.

### Stage 2: compose and screenshot

Edit the `cards` configuration in `render.mjs`. Add a new project as one
configuration entry rather than forking the script. Each entry supplies the
project's:

- palette (`bg`, `ink`, `soft`, `accent`, and optional gradient)
- copy (`eyebrow`, `title`, `sub`, and `footer`)
- real brand mark and background art paths
- typography and title sizing
- optional mark treatment such as pixelation
- optional `fadeEnd` when an artwork element near the left edge needs to stay
  visible through the text fade

The renderer in this skill composes that configuration in HTML using real
installed fonts and screenshots it at exactly `1200x630` with headless
Chromium:

```bash
cd /home/ubuntu/repos/getsu/.agents/skills/generating-og-cards
node render.mjs getsu
identify /home/ubuntu/og/out/getsu-og.png
```

It may render every configured card when no project id is supplied:

```bash
node render.mjs
```

Set `OG_OUT` to write cards somewhere else; it defaults to
`/home/ubuntu/og/out`:

```bash
OG_OUT=/tmp/og-out node render.mjs getsu
```

### Important image-loading gotcha

`page.setContent()` creates an `about:blank` origin. Local `file://`
subresources can therefore fail silently. `render.mjs` reads every local PNG or
SVG and embeds it as a base64 `data:` URI before calling `setContent()`. Do not
change those sources back to `file://`.

The renderer also checks every `<img>` after `setContent()` and throws unless
its `naturalWidth` is greater than zero. Treat a failed image-load assertion as
a broken render, not as a warning.

## Metadata checklist

For every page that emits social metadata:

- Use an absolute HTTPS `og:image` URL.
- Include `og:image:width` = `1200`.
- Include `og:image:height` = `630`.
- Include `og:image:type` = `image/png`.
- Include descriptive `og:image:alt`.
- Target exactly `1200x630` (a 1.91:1 aspect ratio). X/Twitter and Facebook
  may crop materially different ratios even when the source image is larger.
- Set `twitter:card` to `summary_large_image`.
- Set an absolute HTTPS `twitter:image`.
- Twitter fields use `name="twitter:*"`, not `property="twitter:*"`.
- Keep JSON-LD `image` on the square brand logo when it identifies the
  organization or product mark; the social card is a different asset.
- In Next.js, a child `openGraph` object replaces rather than merges the
  layout's object. Repeat the image details in route-level metadata when the
  child route needs them.

Copy the resulting `og.png` (or the repository's existing convention) into the
static asset directory and verify that the deployment build includes it.

## Getsu verification

The minimum non-visual verification is:

```bash
mkdir -p /home/ubuntu/og/art /home/ubuntu/og/out
cd /home/ubuntu/repos/getsu/.agents/skills/generating-og-cards
npm install
npx playwright install chromium
node render.mjs getsu
identify /home/ubuntu/og/out/getsu-og.png
```

Expected output dimensions are `1200x630`. A successful render also proves the
image-load assertion passed. Visual inspection is still required where an image
viewer is available: check that the art and mark are visible, text is crisp and
uncropped, and text does not collide with the artwork.

`identify` is provided by ImageMagick. Install it on a fresh Debian/Ubuntu
machine if it is unavailable:

```bash
sudo apt-get update
sudo apt-get install -y imagemagick
```

## Devin Secrets Needed

None. Font downloads and local Chromium rendering do not require credentials.
