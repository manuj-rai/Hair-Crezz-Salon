import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function Modal({
  children,
  onClose,
  title,
  size = 'md',
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-primary/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`card w-full ${widths[size]} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h3 className="font-display text-lg sm:text-xl">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export type ConfirmOpts = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  opts,
  onClose,
}: {
  open: boolean;
  opts: ConfirmOpts | null;
  onClose: () => void;
}) {
  if (!open || !opts) return null;

  async function handleConfirm() {
    if (!opts) return;
    await opts.onConfirm();
    onClose();
  }

  return (
    <Modal title={opts.title} onClose={onClose}>
      <div className="flex items-start gap-3">
        {opts.destructive && (
          <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 grid place-items-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm text-muted leading-relaxed flex-1">{opts.message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-outline btn-sm" onClick={onClose}>
          {opts.cancelLabel ?? 'Cancel'}
        </button>
        <button
          className={`btn-sm ${opts.destructive ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
          onClick={handleConfirm}
        >
          {opts.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const confirm = (o: ConfirmOpts) => setOpts(o);
  const dialog = <ConfirmDialog open={!!opts} opts={opts} onClose={() => setOpts(null)} />;
  return { confirm, dialog };
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { pill: string; dot: string }> = {
    pending: { pill: 'bg-amber-50 text-amber-800 ring-amber-200/70', dot: 'bg-amber-500' },
    confirmed: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70', dot: 'bg-emerald-500' },
    cancelled: { pill: 'bg-red-50 text-red-700 ring-red-200/70', dot: 'bg-red-500' },
    completed: { pill: 'bg-blue-50 text-blue-800 ring-blue-200/70', dot: 'bg-blue-500' },
    no_show: { pill: 'bg-zinc-100 text-zinc-700 ring-zinc-200', dot: 'bg-zinc-400' },
  };
  const s = styles[status] ?? styles.no_show;
  const label = status.replace('_', ' ');
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize whitespace-nowrap ring-1 ring-inset ' +
        s.pill
      }
    >
      <span className={'h-1.5 w-1.5 rounded-full shrink-0 ' + s.dot} />
      {label}
    </span>
  );
}
