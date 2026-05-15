import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function Modal({
  children,
  onClose,
  title,
  subtitle,
  size = 'md',
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/45 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${widths[size]} max-h-[90vh] flex flex-col bg-bg rounded-t-2xl sm:rounded-2xl border border-ink/[0.08] shadow-glow animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/[0.08] px-5 sm:px-6 py-4 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-xl sm:text-2xl tracking-tight leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-full border border-ink/15 text-muted hover:text-ink hover:border-ink transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
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
      <div className="flex items-start gap-4">
        {opts.destructive && (
          <div className="h-10 w-10 rounded-full bg-red-50 text-red-700 grid place-items-center shrink-0 ring-1 ring-red-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm text-muted leading-relaxed flex-1 pt-1">{opts.message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-8">
        <button className="btn-outline btn-sm" onClick={onClose}>
          {opts.cancelLabel ?? 'Cancel'}
        </button>
        <button
          className={
            opts.destructive
              ? 'btn btn-sm bg-red-600 text-white hover:bg-red-700'
              : 'btn-primary btn-sm'
          }
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
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] whitespace-nowrap ring-1 ring-inset ' +
        s.pill
      }
    >
      <span className={'h-1.5 w-1.5 rounded-full shrink-0 ' + s.dot} />
      {label}
    </span>
  );
}

/**
 * Editorial page header used by admin CRUD pages.
 * Lead with the eyebrow + Playfair title, then put filters / actions on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow-ink">{eyebrow}</p>}
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight mt-2 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
