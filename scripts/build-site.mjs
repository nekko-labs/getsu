/**
 * Combined site build for Vercel.
 *
 * Produces a single static output that serves the marketing page at `/` and the
 * full local-first app at `/app/`:
 *
 *   _site/            <- apps/site/*        (getsu.app landing page)
 *   _site/app/        <- apps/web/dist/*    (the app; Vite base is './', so it
 *                                            runs correctly under a subpath)
 *
 * Run via `npm run build:site` (see package.json). Vercel's vercel.json points
 * its buildCommand here and serves `_site` as the output directory.
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');
const app = join(out, 'app');

console.log('› building the app (packages + apps/web)…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

console.log('› assembling _site (landing at /, app at /app/)…');
rmSync(out, { recursive: true, force: true });
mkdirSync(app, { recursive: true });
cpSync(join(root, 'apps/site'), out, { recursive: true });
cpSync(join(root, 'apps/web/dist'), app, { recursive: true });

if (!existsSync(join(out, 'index.html')) || !existsSync(join(app, 'index.html'))) {
  console.error('✗ expected index.html at both / and /app/');
  process.exit(1);
}
console.log('✓ _site ready');
