import { useEffect } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-paper border border-line p-8 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)]"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display font-light uppercase tracking-tight text-2xl leading-[0.95]"
        >
          {title}
        </h2>
        <p className="text-muted mt-3 text-sm">{message}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="font-mono uppercase tracking-wider text-sm rounded-full border-2 border-ink text-ink px-5 py-2.5 hover:bg-ink hover:text-paper transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
