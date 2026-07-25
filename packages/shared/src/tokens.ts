// The single source of truth for Getsu's visual tokens.
//
// `tokens.json` is read by three consumers: this module (typed access for
// native and any TS caller), `scripts/gen-tokens.mjs` (which emits the web's
// CSS custom properties), and the docs. Add a token once, here, and both
// platforms get it — parity stops being a manual copy/paste.
import raw from './tokens.json';

export type ThemeName = 'light' | 'dark';

/** Every token name, derived from the JSON so the two can never drift. */
export type TokenName = keyof typeof raw.light;

export type Tokens = Record<TokenName, string>;

export const LIGHT: Tokens = raw.light;
export const DARK: Tokens = raw.dark;

export const THEMES: Record<ThemeName, Tokens> = { light: LIGHT, dark: DARK };

export function tokensFor(theme: ThemeName | undefined): Tokens {
  return theme === 'dark' ? DARK : LIGHT;
}

/** `surface2` → `--surface-2`, `onScrimSoft` → `--on-scrim-soft`. */
export function cssVarName(token: string): string {
  return `--${token.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}`;
}

/** `surface2` → `var(--surface-2)`, for style objects on the web. */
export function cssVar(token: TokenName): string {
  return `var(${cssVarName(token)})`;
}
