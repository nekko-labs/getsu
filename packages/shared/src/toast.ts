// A tiny platform-agnostic toast bus.
//
// Getsu is local-first: a failed vault write, a failed folder mirror or a
// failed sync is the one class of error the user *must* see, and it can be
// raised from places that are not React (the zustand stores, the persistence
// timers). So the queue lives here as a plain emitter; web and native each
// render it with their own primitives.

export type ToastKind = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Optional second line: what the user can do about it. */
  detail?: string;
  /** Auto-dismiss delay in ms; errors stay until dismissed when 0. */
  duration: number;
}

type Listener = (toasts: Toast[]) => void;

const DEFAULT_DURATION: Record<ToastKind, number> = {
  error: 8000,
  success: 3000,
  info: 4000,
};

let queue: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = queue;
  for (const l of listeners) l(snapshot);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue);
  return () => { listeners.delete(listener); };
}

export function getToasts(): Toast[] {
  return queue;
}

export function dismissToast(id: number): void {
  const next = queue.filter((t) => t.id !== id);
  if (next.length === queue.length) return;
  queue = next;
  emit();
}

export function pushToast(
  kind: ToastKind,
  message: string,
  options: { detail?: string; duration?: number } = {},
): number {
  const id = nextId++;
  const duration = options.duration ?? DEFAULT_DURATION[kind];
  // Collapse repeats: a retry loop shouldn't stack ten identical toasts.
  queue = [...queue.filter((t) => !(t.kind === kind && t.message === message)), { id, kind, message, detail: options.detail, duration }];
  emit();
  return id;
}

export const toast = {
  error: (message: string, detail?: string) => pushToast('error', message, { detail }),
  success: (message: string, detail?: string) => pushToast('success', message, { detail }),
  info: (message: string, detail?: string) => pushToast('info', message, { detail }),
  dismiss: dismissToast,
};

/** Test hook: drop every queued toast. */
export function clearToasts(): void {
  queue = [];
  emit();
}
