import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';

export function PageHeader({ title, subtitle, right }: { title: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="serif text-3xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({ title, hint, children, muted }: { title: string; hint?: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section className={`card p-5 ${muted ? 'opacity-90' : ''}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>{title}</h2>
        {hint && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** The small all-caps label that opens a block on the month/reflect surfaces. */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const label = (
    <span className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>
      {children}
    </span>
  );
  if (!right) return label;
  return <div className="flex items-center justify-between">{label}{right}</div>;
}

/** A number and its caption, on a quiet tile (year-in-review, insights). */
export function Stat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'var(--surface-2)' }}>
      <div className="serif text-2xl font-semibold">{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</div>
    </div>
  );
}

/** A rounded accent pill (tracker totals, tags). */
export function Chip({ children, color, background }: { children: ReactNode; color?: string; background?: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-sm"
      style={{ background: background ?? 'var(--accent-soft)', color: color ?? 'var(--accent)' }}
    >
      {children}
    </span>
  );
}

/** An icon + one calm sentence, for surfaces with nothing in them yet. */
export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-5" style={{ background: 'var(--surface-2)' }}>
      {icon}
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>{children}</p>
    </div>
  );
}

/**
 * The quiet accent action used across the AI surfaces
 * ("Go deeper with Claude", "Draft year-in-review").
 */
export function SoftButton({
  onClick,
  disabled,
  icon,
  children,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95 disabled:opacity-60 ${className}`}
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
    >
      {icon}
      {children}
    </button>
  );
}

/** A circular icon-only control (nav arrows, overlay chrome). */
export function IconButton({
  onClick,
  label,
  children,
  size = 40,
  onScrim,
  className = '',
  style,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  children: ReactNode;
  size?: number;
  /** Renders for legibility on a dark scrim (lightbox chrome) instead of paper. */
  onScrim?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full transition active:scale-95 ${onScrim ? 'hover:bg-[var(--scrim-surface)]' : ''} ${className}`}
      style={{
        height: size,
        width: size,
        color: onScrim ? 'var(--on-scrim)' : 'var(--text)',
        border: onScrim ? 'none' : '1px solid var(--border)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal overlay with real dialog semantics: `role="dialog"` + `aria-modal`,
 * Escape to close, Tab cycling trapped inside, the page behind made inert, and
 * focus returned to whatever opened it. Rendered in a portal on `document.body`
 * so the app root really can be hidden from assistive tech while it is open.
 */
export function Dialog({
  onClose,
  label,
  children,
  className = '',
  style,
  closeOnBackdrop = true,
}: {
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  closeOnBackdrop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Read once, on mount: this is the element focus must come home to.
  const openerRef = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null));

  useEffect(() => {
    const opener = openerRef.current;
    const root = document.getElementById('root');
    const bodyOverflow = document.body.style.overflow;
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog so the keyboard is inside it from the start.
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();

    return () => {
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
      document.body.style.overflow = bodyOverflow;
      opener?.focus?.();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (n) => n.offsetParent !== null || n === document.activeElement,
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
      className={className}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}

/** An add/remove list of short text items (highlights, struggles, gratitude). */
export function EditableList({
  items,
  onChange,
  placeholder,
  accent,
  emptyText,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  accent?: string;
  emptyText?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <ul className="mb-2 space-y-1.5">
        {items.length === 0 && emptyText && (
          <li className="text-sm italic" style={{ color: 'var(--text-faint)' }}>{emptyText}</li>
        )}
        {items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2 rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent ?? 'var(--accent)' }} />
            <span className="flex-1 text-sm leading-snug">{item}</span>
            <button
              className="opacity-0 transition group-hover:opacity-100"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              style={{ color: 'var(--text-faint)' }}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn shrink-0" onClick={add} aria-label="Add">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
