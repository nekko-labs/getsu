import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { subscribeToasts, dismissToast, type Toast, type ToastKind } from '@getsu/core';

const ICON: Record<ToastKind, typeof Info> = { error: AlertTriangle, success: Check, info: Info };
const COLOR: Record<ToastKind, string> = { error: 'var(--error)', success: 'var(--success)', info: 'var(--info)' };

function ToastRow({ toast }: { toast: Toast }) {
  const Icon = ICON[toast.kind];

  useEffect(() => {
    if (!toast.duration) return;
    const id = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration]);

  return (
    <div
      className="card animate-toast-in pointer-events-auto flex w-full items-start gap-3 p-3.5"
      style={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <Icon size={16} style={{ color: COLOR[toast.kind], marginTop: 2 }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium leading-snug">{toast.message}</p>
        {toast.detail && (
          <p className="mt-0.5 text-[12px] leading-snug" style={{ color: 'var(--text-soft)' }}>{toast.detail}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded-full p-1 transition hover:opacity-100"
        style={{ color: 'var(--text-faint)' }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Renders the shared toast queue. Mounted once, near the root: failures raised
 * from non-React code (vault writes, folder mirroring, sync, AI calls) reach
 * the user instead of dying in a swallowed catch.
 */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      role="region"
      aria-label="Notifications"
    >
      {/* Errors must be announced; the polite live region avoids interrupting typing. */}
      <div aria-live="polite" aria-atomic="false" className="contents">
        {toasts.map((t) => <ToastRow key={t.id} toast={t} />)}
      </div>
    </div>
  );
}
