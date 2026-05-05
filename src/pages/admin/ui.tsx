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
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-red-100 text-red-900',
    completed: 'bg-blue-100 text-blue-900',
    no_show: 'bg-zinc-200 text-zinc-700',
  };
  return <span className={'badge ' + (map[status] ?? 'bg-zinc-200 text-zinc-700')}>{status.replace('_', ' ')}</span>;
}
