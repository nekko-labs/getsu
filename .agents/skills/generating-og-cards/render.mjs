import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.OG_OUT ?? '/home/ubuntu/og/out';
fs.mkdirSync(OUT, { recursive: true });

const cards = [
  {
    id: 'getsu',
    art: '/home/ubuntu/og/art/getsu-bg.png',
    mark: '/home/ubuntu/repos/getsu/apps/site/logo.png',
    bg: '#fbf7f1',
    ink: '#2b2724',
    soft: '#7a726a',
    accent: '#3e8fa0',
    titleFont: "Fraunces, Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'getsu.app',
    title: 'A life you can<br>look back on',
    sub: 'A calm, anti-streak monthly journal. Set your goals for the year, place them on the months where they’ll happen.',
    footer: 'Local-first · Free · Yours',
    titleSize: 74,
  },
  {
    id: 'kotrain',
    art: '/home/ubuntu/og/art/kotrain-bg.png',
    mark: '/home/ubuntu/repos/kotrain/apps/website/favicon.svg',
    bg: '#01050b',
    ink: '#f2f6fa',
    soft: '#8ca5ae',
    accent: '#22d3ee',
    titleFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'kotrain.com',
    title: 'KOTRAIN',
    sub: 'Train your models. Run your agents. Own your machine. An open-source, local-first AI coding &amp; cowork app.',
    footer: 'Ollama · LM Studio · vLLM · every cloud provider',
    titleSize: 88,
    titleTrack: '0.06em',
    gradientTitle: ['#6d5efc', '#22d3ee'],
  },
  {
    id: 'mynichi',
    art: '/home/ubuntu/og/art/mynichi-bg.png',
    mark: null,
    bg: '#faf7f0',
    ink: '#2a2732',
    soft: '#6b6575',
    accent: '#e4573d',
    titleFont: "Fraunces, Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'mynichi.app',
    title: 'Your day is<br>the curriculum.',
    sub: 'Japanese for people living in Japan. Capture what you meet each day, understand it, and actually keep it.',
    footer: 'No lessons · No streaks · No owl',
    titleSize: 70,
  },
  {
    id: 'vaizer',
    art: '/home/ubuntu/og/art/vaizer-bg.png',
    mark: '/home/ubuntu/repos/vaizer/src/app/icon.png',
    bg: '#ece9e1',
    ink: '#20222b',
    soft: '#6b6e7c',
    accent: '#5646d4',
    titleFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'vaizer.app',
    title: 'See, shape, and<br>steer your agents.',
    sub: 'Agent and prompt management made visible: break any skill into a readable workflow, version your prompts, run every session from one HUD.',
    footer: 'Skills · Prompts · Config · HUD',
    titleSize: 62,
  },
  {
    id: 'nekko-apfs',
    art: '/home/ubuntu/og/art/nekko-apfs-bg.png',
    mark: '/home/ubuntu/repos/nekko-apfs/web/assets/nekko-cat.svg',
    markPixelated: true,
    bg: '#F5F2EC',
    ink: '#2A2F36',
    soft: '#6B7280',
    accent: '#C8A6E3',
    titleFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'nekkoapfs.com',
    title: 'Read APFS drives<br>on Windows.',
    sub: 'A free, open-source Windows app for reading and writing Apple’s APFS filesystem — including FileVault-encrypted volumes.',
    footer: 'Open source · MIT / Apache-2.0 · Pre-release',
    titleSize: 62,
  },
  {
    id: 'simplesharing',
    art: '/home/ubuntu/og/art/simplesharing-bg.png',
    mark: null,
    bg: '#fdfdfc',
    ink: '#16181d',
    soft: '#5c6270',
    accent: '#2b59ff',
    titleFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    eyebrow: 'simplesharing.app',
    title: 'Your agents make things.<br>Now share them.',
    sub: 'Markdown reports, HTML dashboards, Claude skills: drop one in and get a beautiful link anyone can open.',
    footer: 'Markdown · HTML · Claude skills · Early preview',
    titleSize: 52,
    fadeEnd: 54,
  },
];

function imageDataUri(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : null;
  if (!mime) throw new Error(`unsupported image type: ${file}`);
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

const html = (c) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: 1200px 630px; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body { background:${c.bg}; font-family:${c.bodyFont}; -webkit-font-smoothing:antialiased; }
  .card { position:relative; width:1200px; height:630px; overflow:hidden; }
  .art { position:absolute; top:0; right:0; height:630px; width:auto; }
  .fade { position:absolute; inset:0;
    background:linear-gradient(to right, ${c.bg} 0%, ${c.bg} 34%, ${hexA(c.bg, 0.92)} ${c.fadeEnd ? c.fadeEnd - 18 : 44}%, ${hexA(c.bg, 0.0)} ${c.fadeEnd ?? 62}%); }
  .content { position:absolute; inset:0; padding:64px 70px; display:flex; flex-direction:column; }
  .top { display:flex; align-items:center; gap:16px; }
  .mark { width:52px; height:52px; ${c.markPixelated ? 'image-rendering:pixelated;' : ''} border-radius:${c.markRadius ?? 12}px; }
  .dot { width:12px; height:12px; border-radius:50%; background:${c.accent}; }
  .eyebrow { font-family:${c.monoFont}; font-size:19px; letter-spacing:0.18em; text-transform:uppercase; color:${c.soft}; }
  .mid { flex:1; display:flex; flex-direction:column; justify-content:center; max-width:660px; }
  h1 { font-family:${c.titleFont}; font-size:${c.titleSize}px; line-height:1.05; font-weight:700;
       letter-spacing:${c.titleTrack ?? '-0.02em'}; color:${c.ink};
       ${c.gradientTitle ? `background:linear-gradient(100deg, ${c.gradientTitle[0]}, ${c.gradientTitle[1]});-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : ''} }
  p.sub { margin-top:24px; font-size:25px; line-height:1.45; color:${c.soft}; max-width:610px; font-weight:400; }
  .rule { width:76px; height:5px; border-radius:3px; background:${c.accent}; margin-top:30px; }
  .foot { font-family:${c.monoFont}; font-size:18px; color:${c.soft}; letter-spacing:0.02em; }
</style></head>
<body><div class="card">
  <img class="art" src="${imageDataUri(c.art)}">
  <div class="fade"></div>
  <div class="content">
    <div class="top">
      ${c.mark ? `<img class="mark" src="${imageDataUri(c.mark)}">` : `<span class="dot"></span>`}
      <span class="eyebrow">${c.eyebrow}</span>
    </div>
    <div class="mid">
      <h1>${c.title}</h1>
      <p class="sub">${c.sub}</p>
      <div class="rule"></div>
    </div>
    <div class="foot">${c.footer}</div>
  </div>
</div></body></html>`;

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const only = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--no-sandbox', '--force-device-scale-factor=1'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const c of cards) {
  if (only.length && !only.includes(c.id)) continue;
  if (!fs.existsSync(c.art)) throw new Error(`missing art: ${c.art}`);
  await page.setContent(html(c), { waitUntil: 'load' });
  await page.evaluate(() => {
    const broken = [...document.images].filter((img) => img.naturalWidth === 0);
    if (broken.length) throw new Error(`image failed to load: ${broken.map((img) => img.alt || img.src.slice(0, 80)).join(', ')}`);
  });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(OUT, `${c.id}-og.png`);
  await page.screenshot({ path: out });
  console.log('wrote', out);
}
await browser.close();
