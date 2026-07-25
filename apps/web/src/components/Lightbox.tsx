import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { type PhotoRef } from '@getsu/core';
import { Dialog, IconButton } from './ui';

interface LightboxProps {
  photos: PhotoRef[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onCaption: (photoId: string, caption: string) => void;
  onDelete: (photoId: string) => void;
}

/**
 * Full-screen photo viewer: large image, editable caption, prev/next across the
 * set, delete. A real modal dialog (focus trapped, page behind inert, focus
 * returned to the thumbnail). Keyboard: Esc closes, ←/→ navigate. Backdrop
 * click closes.
 */
export default function Lightbox({ photos, index, onIndexChange, onClose, onCaption, onDelete }: LightboxProps) {
  const photo = photos[index];
  const [draft, setDraft] = useState(photo?.caption ?? '');

  // Keep the caption draft in sync when navigating between photos.
  useEffect(() => { setDraft(photo?.caption ?? ''); }, [photo?.id]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < photos.length) onIndexChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!photo) return null;

  const commitCaption = () => { if (draft !== (photo.caption ?? '')) onCaption(photo.id, draft); };

  return (
    <Dialog
      onClose={onClose}
      label={`Photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-50 flex flex-col animate-fade"
      style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)', color: 'var(--on-scrim)' }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[12.5px] tabular-nums" style={{ color: 'var(--on-scrim-soft)' }}>
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            size={36}
            onScrim
            label="Delete photo"
            onClick={() => { if (confirm('Delete this photo? This cannot be undone.')) onDelete(photo.id); }}
          >
            <Trash2 size={18} />
          </IconButton>
          <IconButton size={36} onScrim label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
      </div>

      {/* image + nav */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {index > 0 && (
          <IconButton size={44} onScrim label="Previous photo" className="absolute left-2 z-10" onClick={() => go(-1)}>
            <ChevronLeft size={26} />
          </IconButton>
        )}
        <img
          src={photo.src}
          alt={photo.caption ?? ''}
          className="max-h-full max-w-full rounded-lg object-contain animate-rise"
        />
        {index < photos.length - 1 && (
          <IconButton size={44} onScrim label="Next photo" className="absolute right-2 z-10" onClick={() => go(1)}>
            <ChevronRight size={26} />
          </IconButton>
        )}
      </div>

      {/* caption editor */}
      <div className="px-4 pb-6 pt-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitCaption}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitCaption(); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Add a caption…"
          aria-label="Photo caption"
          className="mx-auto block w-full max-w-lg rounded-full border-0 px-4 py-2.5 text-center text-[14px] outline-none placeholder:text-[var(--on-scrim-faint)]"
          style={{ background: 'var(--scrim-surface)', color: 'var(--on-scrim)' }}
        />
      </div>
    </Dialog>
  );
}
