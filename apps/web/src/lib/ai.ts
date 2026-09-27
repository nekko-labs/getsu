import Anthropic from '@anthropic-ai/sdk';
import { type AIProvider, type AICompletionInput, mockProvider } from '@getsu/core';

// Web AI layer: turns the user's locally-stored, bring-your-own Claude key into
// a core AIProvider. No key → the offline mock provider (the assistant still
// works, just heuristically). The key lives only in localStorage — never in the
// vault, so it isn't exported, synced, or written to the folder.

const KEY_STORAGE = 'getsu-ai-key';
const MODEL_STORAGE = 'getsu-ai-model';

export interface AIModel {
  id: string;
  label: string;
  /** Whether the model accepts `output_config.effort`. Sending it elsewhere is a 400. */
  effort: boolean;
}

// The models offered in settings, newest first. Hardcoded on purpose: the list
// is small, changes rarely, and a network lookup would make the settings screen
// depend on a valid key. Labels stay descriptive rather than ranked ("most
// capable" goes stale the moment a new model lands).
export const MODELS: AIModel[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', effort: true },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (faster, cheaper)', effort: true },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)', effort: false },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function getStoredKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
}

export function setStoredKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* ignore */ }
}

export function getStoredModel(): string {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE);
    // A model that's no longer offered (a retired default, a hand-edited value)
    // falls back, so the picker never renders with nothing selected.
    return MODELS.find((m) => m.id === stored)?.id ?? DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setStoredModel(model: string): void {
  try { localStorage.setItem(MODEL_STORAGE, model || DEFAULT_MODEL); } catch { /* ignore */ }
}

export function aiConfigured(): boolean {
  return getStoredKey().length > 0;
}

/** A Claude-backed provider using the official SDK (BYO key, direct from browser). */
export function createClaudeProvider(apiKey: string, model = DEFAULT_MODEL): AIProvider {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return {
    available: true,
    label: 'Claude',
    async complete(input: AICompletionInput): Promise<string> {
      // Opus 5.5 always thinks, and the thinking counts inside `max_tokens`.
      // Low effort keeps enough of these modest budgets for the actual answer.
      const effort = MODELS.find((m) => m.id === model)?.effort;
      const res = await client.messages.create({
        model,
        max_tokens: input.maxTokens ?? 800,
        system: input.system,
        messages: [{ role: 'user', content: input.user }],
        ...(effort ? { output_config: { effort: 'low' as const } } : {}),
      });
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    },
  };
}

/** The active provider based on current settings: Claude if a key is set, else mock. */
export function getAIProvider(): AIProvider {
  const key = getStoredKey();
  if (!key) return mockProvider;
  return createClaudeProvider(key, getStoredModel());
}
