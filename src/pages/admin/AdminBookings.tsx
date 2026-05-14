import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  IndianRupee,
  ListFilter,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Trash2,
  User,
  UserX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Booking, BookingStatus, Service, Stylist } from '../../types/db';
import { fmtTime12, inr, isoDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { generateSlots, type Slot } from '../../lib/slots';
import { site } from '../../config/site';
import { composeBookingNotes, parseBookingNotes } from '../../lib/booking';
import { Modal, StatusBadge, useConfirm } from './ui';

const statusFilters: ({ value: BookingStatus | 'all'; label: string })[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

type RangeKey = 'today' | 'week' | 'month' | 'all' | 'custom';
const ranges: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

function rangeBounds(r: RangeKey): { from: string | null; to: string | null } {
  const today = new Date();
  if (r === 'today') return { from: isoDate(today), to: isoDate(today) };
  if (r === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (r === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  return { from: null, to: null };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [range, setRange] = useState<RangeKey>('all');
  const [customFrom, setCustomFrom] = useState<string>(isoDate(new Date()));
  const [customTo, setCustomTo] = useState<string>(isoDate(new Date()));
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Booking | null>(null);

  const { confirm, dialog } = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const [b, s, st] = await Promise.all([
        repo.listBookings(),
        repo.listServices(false),
        site.sections.stylists ? repo.listStylists(false) : Promise.resolve([]),
      ]);
      setBookings(b);
      setServices(s);
      setStylists(st);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const { from, to } = useMemo(() => {
    if (range === 'custom') return { from: customFrom, to: customTo };
    return rangeBounds(range);
  }, [range, customFrom, customTo]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (from && b.date < from) return false;
      if (to && b.date > to) return false;
      if (q) {
        const hay = `${b.customer_name} ${b.phone} ${b.email ?? ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, filter, q, from, to]);

  const totals = useMemo(() => {
    const counted = filtered.filter((b) => b.status !== 'cancelled');
    return {
      count: filtered.length,
      revenue: counted.reduce((s, b) => s + b.price, 0),
    };
  }, [filtered]);

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? '—';
  const stylistName = (id: string | null) => (id ? stylists.find((s) => s.id === id)?.name ?? '—' : 'Any');

  async function setStatus(b: Booking, status: BookingStatus) {
    try {
      await repo.updateBookingStatus(b.id, status);
      setBookings((xs) => xs.map((x) => (x.id === b.id ? { ...x, status } : x)));
      if (detail?.id === b.id) setDetail({ ...b, status });
      toast.success(`Booking ${status}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not update status');
    }
  }

  function askDelete(b: Booking) {
    confirm({
      title: 'Delete booking?',
      message: `This permanently removes ${b.customer_name}'s appointment on ${b.date}. This can't be undone.`,
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await repo.deleteBooking(b.id);
          setBookings((xs) => xs.filter((x) => x.id !== b.id));
          if (detail?.id === b.id) setDetail(null);
          toast.success('Booking deleted');
        } catch (e) {
          console.error(e);
          toast.error('Could not delete booking');
        }
      },
    });
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  return (
    <div>
      <header className="mb-4 sm:mb-6 hidden lg:flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Bookings</h1>
          <p className="text-muted text-sm mt-1">Confirm, cancel and complete appointments.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add booking
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-5">
        <SummaryCard
          label="Showing"
          value={totals.count}
          sub={`of ${bookings.length}`}
          icon={<ListFilter className="h-4 w-4" />}
        />
        <SummaryCard
          label="Revenue"
          value={inr(totals.revenue)}
          sub="excl. cancelled"
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          sub="needs action"
          accent={pendingCount > 0}
          icon={<AlertCircle className="h-4 w-4" />}
          onClick={pendingCount > 0 ? () => setFilter('pending') : undefined}
        />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute top-3.5 left-3 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, email"
            className="input pl-9"
          />
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary lg:hidden shrink-0" aria-label="Add booking">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={load} className="btn-outline shrink-0" title="Refresh"><RotateCcw className="h-4 w-4" /></button>
      </div>

      <div className="flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 mb-2">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs border whitespace-nowrap shrink-0 transition',
              range === r.value ? 'bg-primary text-primary-fg border-primary' : 'border-border text-muted hover:text-ink',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-xs text-muted">From</span>
          <input type="date" className="input py-1.5 text-sm w-auto" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <span className="text-xs text-muted">To</span>
          <input type="date" className="input py-1.5 text-sm w-auto" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 mb-3 sm:mb-4">
        {statusFilters.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs border whitespace-nowrap shrink-0 transition',
              filter === s.value ? 'bg-ink text-bg border-ink' : 'border-border text-muted hover:text-ink',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 shimmer-bg animate-shimmer" />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-muted text-sm">No bookings match these filters.</div>
        ) : filtered.map((b) => {
          const parsed = parseBookingNotes(b.notes);
          return (
            <button
              key={b.id}
              onClick={() => setDetail(b)}
              className="w-full card p-3 text-left hover:border-ink transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{b.customer_name}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-xs text-muted mt-0.5 truncate">
                    {parsed.services ?? serviceName(b.service_id)}
                  </div>
                  <div className="text-xs text-muted mt-1.5 flex items-center gap-2">
                    <span>{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>·</span>
                    <span>{fmtTime12(b.time)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold">{inr(b.price)}</div>
                  <ChevronRight className="h-4 w-4 text-muted ml-auto mt-1" />
                </div>
              </div>
              {(b.status === 'pending' || b.status === 'confirmed') && (
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  {b.status !== 'confirmed' && (
                    <button
                      onClick={() => setStatus(b, 'confirmed')}
                      className="flex-1 btn-outline btn-sm !py-1.5 text-emerald-700 border-emerald-200 bg-emerald-50/50"
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(b, 'cancelled')}
                    className="flex-1 btn-outline btn-sm !py-1.5 text-red-600 border-red-200 bg-red-50/40"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-[13px] table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[28%]" />
            {site.sections.stylists && <col className="w-[14%]" />}
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted bg-bg/60 border-b border-border">
              <th className="text-left py-2.5 px-3 font-semibold">Customer</th>
              <th className="text-left py-2.5 px-3 font-semibold">Service</th>
              {site.sections.stylists && <th className="text-left py-2.5 px-3 font-semibold">Stylist</th>}
              <th className="text-left py-2.5 px-3 font-semibold">When</th>
              <th className="text-left py-2.5 px-3 font-semibold">Status</th>
              <th className="text-right py-2.5 px-3 font-semibold">Amount</th>
              <th className="text-right py-2.5 px-3 font-semibold sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-3">
                    <div className="h-7 rounded shimmer-bg animate-shimmer" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted py-12">No bookings match these filters.</td></tr>
            ) : filtered.map((b) => {
              const parsed = parseBookingNotes(b.notes);
              const serviceText = parsed.services ?? serviceName(b.service_id);
              return (
                <tr
                  key={b.id}
                  className="group hover:bg-bg/40 cursor-pointer transition-colors"
                  onClick={() => setDetail(b)}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-medium truncate">{b.customer_name}</div>
                    <div className="text-xs text-muted truncate">{b.phone}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="truncate" title={serviceText}>{serviceText}</div>
                    {parsed.userNotes && (
                      <div className="text-xs text-muted italic truncate" title={parsed.userNotes}>"{parsed.userNotes}"</div>
                    )}
                  </td>
                  {site.sections.stylists && (
                    <td className="py-2.5 px-3 text-muted truncate">{stylistName(b.stylist_id)}</td>
                  )}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div>{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="text-xs text-muted">{fmtTime12(b.time)}</div>
                  </td>
                  <td className="py-2.5 px-3"><StatusBadge status={b.status} /></td>
                  <td className="py-2.5 px-3 text-right font-medium tabular-nums">{inr(b.price)}</td>
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {b.status !== 'confirmed' && b.status !== 'completed' && (
                        <button onClick={() => setStatus(b, 'confirmed')} title="Confirm" className="h-7 w-7 rounded-md grid place-items-center hover:bg-emerald-50 text-emerald-700">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button onClick={() => setStatus(b, 'cancelled')} title="Cancel" className="h-7 w-7 rounded-md grid place-items-center hover:bg-red-50 text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setDetail(b)} title="Open" className="h-7 w-7 rounded-md grid place-items-center hover:bg-bg text-muted">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && (
        <BookingFormModal
          mode="create"
          services={services.filter((s) => s.active)}
          stylists={stylists.filter((s) => s.active)}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      {detail && (
        <BookingDetailPanel
          booking={detail}
          services={services}
          stylists={stylists}
          onClose={() => setDetail(null)}
          onSetStatus={(s) => setStatus(detail, s)}
          onDelete={() => askDelete(detail)}
          onUpdated={(b) => {
            setBookings((xs) => xs.map((x) => (x.id === b.id ? b : x)));
            setDetail(b);
          }}
        />
      )}

      {dialog}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
  icon,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <div
      className={cn(
        'card p-2.5 sm:p-4 transition text-left w-full h-full',
        accent && 'bg-accent/5 border-accent/40',
        onClick && 'hover:border-ink active:scale-[0.98]',
      )}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {icon && (
              <span
                className={cn(
                  'sm:hidden inline-grid h-4 w-4 place-items-center shrink-0',
                  accent ? 'text-accent' : 'text-muted',
                )}
              >
                {icon}
              </span>
            )}
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted leading-tight truncate">
              {label}
            </div>
          </div>
          <div className="text-base sm:text-2xl font-display mt-0.5 sm:mt-1 leading-tight tabular-nums truncate">
            {value}
          </div>
          {sub && <div className="text-[10px] sm:text-xs text-muted mt-0.5 truncate">{sub}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              'hidden sm:grid h-9 w-9 rounded-lg place-items-center shrink-0',
              accent ? 'bg-accent/15 text-accent' : 'bg-bg text-muted',
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="block">
      {body}
    </button>
  ) : (
    body
  );
}

// ---------------------------------------------------------------- Detail panel

function BookingDetailPanel({
  booking,
  services,
  stylists,
  onClose,
  onSetStatus,
  onDelete,
  onUpdated,
}: {
  booking: Booking;
  services: Service[];
  stylists: Stylist[];
  onClose: () => void;
  onSetStatus: (s: BookingStatus) => void;
  onDelete: () => void;
  onUpdated: (b: Booking) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onClose(), 220);
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [requestClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Booking details">
      <div
        className={cn(
          'absolute inset-0 bg-primary/40 backdrop-blur-sm',
          closing ? 'animate-fade-out' : 'animate-fade-in',
        )}
        onClick={requestClose}
      />
      <div
        className={cn(
          'relative bg-bg w-full sm:max-w-md h-full overflow-y-auto sm:shadow-2xl sm:border-l border-border flex flex-col will-change-transform',
          closing ? 'animate-slide-out-right' : 'animate-slide-in-right',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <BookingFormModal
            mode="edit"
            booking={booking}
            services={services}
            stylists={stylists}
            inline
            onClose={() => setEditing(false)}
            onSaved={(b) => {
              setEditing(false);
              if (b) onUpdated(b);
            }}
          />
        ) : (
          <DetailContent
            booking={booking}
            services={services}
            stylists={stylists}
            onClose={requestClose}
            onSetStatus={onSetStatus}
            onDelete={onDelete}
            onEdit={() => setEditing(true)}
          />
        )}
      </div>
    </div>
  );
}

function DetailContent({
  booking,
  services,
  stylists,
  onClose,
  onSetStatus,
  onDelete,
  onEdit,
}: {
  booking: Booking;
  services: Service[];
  stylists: Stylist[];
  onClose: () => void;
  onSetStatus: (s: BookingStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const parsed = parseBookingNotes(booking.notes);
  const stylist = stylists.find((s) => s.id === booking.stylist_id);
  const primary = services.find((s) => s.id === booking.service_id);
  const serviceText = parsed.services ?? primary?.name ?? '—';

  const initials = booking.customer_name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const transitions: { to: BookingStatus; label: string; icon: typeof Check; tone: 'pos' | 'neu' | 'neg' }[] = [
    { to: 'confirmed', label: 'Confirm', icon: Check, tone: 'pos' },
    { to: 'completed', label: 'Complete', icon: CheckCheck, tone: 'neu' },
    { to: 'cancelled', label: 'Cancel', icon: X, tone: 'neg' },
    { to: 'no_show', label: 'No-show', icon: UserX, tone: 'neg' },
  ];

  return (
    <>
      {/* Sticky header */}
      <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center gap-3 sticky top-0 bg-bg/95 backdrop-blur z-10">
        <div className="h-10 w-10 rounded-full bg-accent/15 text-accent grid place-items-center font-semibold shrink-0">
          {initials || <User className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base sm:text-lg truncate leading-tight">{booking.customer_name}</div>
          <div className="text-xs text-muted truncate">
            Booked {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <a
          href={`tel:${booking.phone}`}
          aria-label="Call customer"
          className="h-9 w-9 rounded-full border border-border bg-surface grid place-items-center text-ink hover:border-ink active:scale-95 transition"
        >
          <Phone className="h-4 w-4" />
        </a>
        <button
          onClick={onClose}
          aria-label="Close"
          className="h-9 w-9 rounded-full border border-border bg-surface grid place-items-center text-muted hover:text-ink active:scale-95 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 pb-32">
        {/* Status + quick actions */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <StatusBadge status={booking.status} />
            <span className="text-[11px] text-muted">
              {new Date(booking.created_at).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {transitions
              .filter((t) => t.to !== booking.status)
              .map((t) => (
                <button
                  key={t.to}
                  onClick={() => onSetStatus(t.to)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition active:scale-[0.98]',
                    t.tone === 'pos' && 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:border-emerald-300',
                    t.tone === 'neg' && 'border-red-200 bg-red-50/70 text-red-700 hover:border-red-300',
                    t.tone === 'neu' && 'border-border bg-surface text-ink hover:border-ink',
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
          </div>
        </div>

        {/* Hero card: service + price + when */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">Service</div>
              <div className="text-sm font-medium leading-snug">{serviceText}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl tabular-nums">{inr(booking.price)}</div>
              <div className="text-[11px] text-muted flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" /> {booking.duration_min} min
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-accent shrink-0" />
            <span className="font-medium">
              {new Date(booking.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="text-muted">·</span>
            <span className="text-ink">{fmtTime12(booking.time)}</span>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Phone} label="Phone" value={booking.phone} href={`tel:${booking.phone}`} />
          <InfoRow icon={Mail} label="Email" value={booking.email || '—'} href={booking.email ? `mailto:${booking.email}` : undefined} />
          {site.sections.stylists && (
            <InfoRow
              icon={User}
              label="Stylist"
              value={stylist ? stylist.name : 'Any available'}
              sub={stylist?.role}
            />
          )}
          <InfoRow icon={Scissors} label="Booking ID" value={booking.id} mono />
        </div>

        {parsed.userNotes && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
              Customer notes
            </div>
            <div className="rounded-lg bg-surface border border-border px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed">
              {parsed.userNotes}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 bg-bg/95 backdrop-blur border-t border-border px-4 sm:px-5 py-3 flex gap-2 safe-pb">
        <button className="btn-outline flex-1" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button
          className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={onDelete}
          aria-label="Delete booking"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
  href,
  mono,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="h-7 w-7 rounded-md bg-accent/10 text-accent grid place-items-center shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold leading-tight">{label}</div>
        <div className={cn('text-sm leading-tight mt-0.5 truncate', mono && 'font-mono text-[12px]')}>{value}</div>
        {sub && <div className="text-[11px] text-muted truncate">{sub}</div>}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition hover:border-ink">
      {content}
    </a>
  ) : (
    content
  );
}

// ---------------------------------------------------------------- Form modal

type Draft = {
  customer_name: string;
  phone: string;
  email: string;
  service_ids: string[];
  stylist_id: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
};

function BookingFormModal({
  mode,
  booking,
  services,
  stylists,
  onClose,
  onSaved,
  inline,
}: {
  mode: 'create' | 'edit';
  booking?: Booking;
  services: Service[];
  stylists: Stylist[];
  onClose: () => void;
  onSaved: (b?: Booking) => void;
  inline?: boolean;
}) {
  const initialServiceIds = useMemo(() => {
    if (!booking) return services[0] ? [services[0].id] : [];
    const parsed = parseBookingNotes(booking.notes);
    if (parsed.services) {
      const names = parsed.services.split(' + ').map((n) => n.trim());
      const ids = names.map((n) => services.find((s) => s.name === n)?.id).filter((id): id is string => Boolean(id));
      return ids.length === names.length ? ids : [booking.service_id];
    }
    return [booking.service_id];
  }, [booking, services]);

  const [draft, setDraft] = useState<Draft>(() => ({
    customer_name: booking?.customer_name ?? '',
    phone: booking?.phone ?? '',
    email: booking?.email ?? '',
    service_ids: initialServiceIds,
    stylist_id: booking?.stylist_id ?? 'any',
    date: booking?.date ?? isoDate(new Date()),
    time: booking?.time ?? '',
    notes: booking ? (parseBookingNotes(booking.notes).userNotes ?? '') : '',
    status: booking?.status ?? 'confirmed',
  }));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => draft.service_ids
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s)),
    [services, draft.service_ids],
  );
  const totalDuration = selected.reduce((s, x) => s + x.duration_min, 0);
  const totalPrice = selected.reduce((s, x) => s + x.price, 0);
  const stylistId = site.sections.stylists && draft.stylist_id !== 'any' ? draft.stylist_id : null;

  useEffect(() => {
    if (selected.length === 0 || !draft.date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    const date = new Date(`${draft.date}T00:00:00`);
    Promise.all([
      repo.listHours(),
      repo.listBookedTimes(draft.date, stylistId),
      repo.listBlocked(draft.date),
    ])
      .then(([hours, booked, blocked]) => {
        const hour = hours.find((h) => h.day_of_week === date.getDay());
        const filtered = mode === 'edit' && booking
          ? booked.filter((b) => !(b.time === booking.time && b.duration_min === booking.duration_min))
          : booked;
        setSlots(generateSlots({ date, hour, durationMin: totalDuration, bookings: filtered, blocked, now: new Date(0) }));
      })
      .catch(() => {
        setSlots([]);
        toast.error('Could not load available times');
      })
      .finally(() => setLoadingSlots(false));
  }, [draft.date, draft.service_ids, totalDuration, stylistId, mode, booking]);

  function toggleService(id: string) {
    setDraft((d) => ({
      ...d,
      service_ids: d.service_ids.includes(id) ? d.service_ids.filter((x) => x !== id) : [...d.service_ids, id],
      time: '',
    }));
  }

  async function save() {
    if (selected.length === 0) {
      toast.error('Select at least one service');
      return;
    }
    if (!draft.customer_name.trim() || !draft.phone.trim() || !draft.date || !draft.time) {
      toast.error('Fill customer, phone, date and time');
      return;
    }
    setSaving(true);
    try {
      const composedNotes = composeBookingNotes(selected.map((s) => s.name), draft.notes);
      if (mode === 'create') {
        await repo.createBooking({
          customer_name: draft.customer_name.trim(),
          phone: draft.phone.trim(),
          email: draft.email.trim() || null,
          service_id: selected[0].id,
          stylist_id: stylistId,
          date: draft.date,
          time: draft.time,
          duration_min: totalDuration,
          price: totalPrice,
          notes: composedNotes,
          status: draft.status,
        });
        toast.success('Booking added');
        onSaved();
      } else if (booking) {
        const updated = await repo.updateBooking(booking.id, {
          customer_name: draft.customer_name.trim(),
          phone: draft.phone.trim(),
          email: draft.email.trim() || null,
          service_id: selected[0].id,
          stylist_id: stylistId,
          date: draft.date,
          time: draft.time,
          duration_min: totalDuration,
          price: totalPrice,
          notes: composedNotes,
          status: draft.status,
        });
        toast.success('Booking updated');
        onSaved(updated);
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not save booking');
    } finally {
      setSaving(false);
    }
  }

  const cats = Array.from(new Set(services.map((s) => s.category)));
  const body = (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Customer</label>
          <input className="input" value={draft.customer_name} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BookingStatus })}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Services <span className="text-muted text-xs">(pick one or more)</span></label>
        <div className="rounded-lg border border-border divide-y divide-border max-h-56 overflow-y-auto">
          {cats.map((c) => (
            <div key={c}>
              <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted bg-bg">{c}</div>
              {services.filter((s) => s.category === c).map((s) => {
                const sel = draft.service_ids.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition',
                      sel ? 'bg-accent/10' : 'hover:bg-bg/60',
                    )}
                  >
                    <span className={cn(
                      'h-4 w-4 rounded-md border grid place-items-center shrink-0',
                      sel ? 'bg-accent border-accent text-accent-fg' : 'border-border',
                    )}>
                      {sel && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-muted text-xs">{s.duration_min}m</span>
                    <span className="font-medium">{inr(s.price)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="text-xs text-muted mt-1.5 flex items-center gap-3">
            <span><Clock className="h-3 w-3 inline" /> {totalDuration} min</span>
            <span className="font-semibold text-ink">{inr(totalPrice)}</span>
          </div>
        )}
      </div>

      {site.sections.stylists && (
        <div>
          <label className="label">Stylist</label>
          <select className="input" value={draft.stylist_id} onChange={(e) => setDraft({ ...draft, stylist_id: e.target.value })}>
            <option value="any">Any stylist</option>
            {stylists.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Time</label>
          <select className="input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })}>
            <option value="">{loadingSlots ? 'Loading...' : 'Select time'}</option>
            {slots.filter((s) => s.available).map((slot) => (
              <option key={slot.time} value={slot.time}>{fmtTime12(slot.time)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="textarea" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={saving || selected.length === 0 || !draft.time}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create booking'}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-bg z-10">
          <h3 className="font-display text-lg">Edit booking</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{body}</div>
      </>
    );
  }

  return (
    <Modal title={mode === 'edit' ? 'Edit booking' : 'New booking'} onClose={onClose} size="lg">
      {body}
    </Modal>
  );
}
