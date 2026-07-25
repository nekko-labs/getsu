// RN has no CSS variables, so tokens arrive as plain objects — but they are the
// *same* objects the web's custom properties are generated from
// (packages/shared/src/tokens.json). Parity is no longer a manual copy.
export { LIGHT, DARK, THEMES, tokensFor, type Tokens, type ThemeName } from '@getsu/shared';

export const serif = 'Georgia'; // Fraunces would be loaded via expo-font in a full build
