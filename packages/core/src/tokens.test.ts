import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { LIGHT, DARK, cssVarName, tokensFor, toast, getToasts, clearToasts, dismissToast } from './index.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('design tokens', () => {
  it('defines the same token names in both themes', () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
  });

  it('maps camelCase tokens onto kebab CSS custom properties', () => {
    expect(cssVarName('surface2')).toBe('--surface-2');
    expect(cssVarName('onScrimSoft')).toBe('--on-scrim-soft');
  });

  it('picks the theme by name, defaulting to light', () => {
    expect(tokensFor('dark')).toBe(DARK);
    expect(tokensFor(undefined)).toBe(LIGHT);
  });

  it('keeps the generated web stylesheet in sync with the token source', () => {
    // Regenerate with `npm run tokens` when this fails.
    const css = readFileSync(join(repoRoot, 'apps/web/src/tokens.generated.css'), 'utf8');
    for (const [name, value] of Object.entries(LIGHT)) {
      expect(css).toContain(`${cssVarName(name)}: ${value};`);
    }
    for (const [name, value] of Object.entries(DARK)) {
      expect(css).toContain(`${cssVarName(name)}: ${value};`);
    }
  });
});

describe('toasts', () => {
  beforeEach(() => clearToasts());

  it('queues and dismisses', () => {
    const id = toast.error('Could not save');
    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0]).toMatchObject({ kind: 'error', message: 'Could not save' });
    dismissToast(id);
    expect(getToasts()).toHaveLength(0);
  });

  it('collapses repeats of the same message so a retry loop cannot stack up', () => {
    toast.error('Sync failed');
    toast.error('Sync failed');
    toast.info('Sync failed');
    expect(getToasts().map((t) => t.kind)).toEqual(['error', 'info']);
  });
});
