import { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Booking, BookingStatus, Service, Stylist } from '../../types/db';
import { fmtTime12, inr } from '../../lib/utils';
import { cn } from '../../lib/utils';

const statusFilters: ({ value: BookingStatus | 'all'; label: string })[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [b, s, st] = await Promise.all([
        repo.listBookings(),
        repo.listServices(false),
        repo.listStylists(false),
      ]);
      setBookings(b);
      setServices(s);
      setStylists(st);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (q) {
        const hay = `${b.customer_name} ${b.phone} ${b.email ?? ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, filter, q]);

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? '—';
  const stylistName = (id: string | null) => (id ? stylists.find((s) => s.id === id)?.name ?? '—' : 'Any');

  async function setStatus(b: Booking, status: BookingStatus) {
    try {
      await repo.updateBookingStatus(b.id, status);
      setBookings((xs) => xs.map((x) => (x.id === b.id ? { ...x, status } : x)));
      toast.success(`Booking ${status}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not update status');
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Bookings</h1>
        <p className="text-muted mt-1">Confirm, cancel and complete appointments.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute top-3.5 left-3 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone or email"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={cn(
                'btn-sm rounded-full px-4 py-2 text-xs border whitespace-nowrap',
                filter === s.value ? 'bg-primary text-primary-fg border-primary' : 'border-border text-muted hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
          <button onClick={load} className="btn-outline btn-sm" title="Refresh"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted bg-bg">
                <th className="text-left py-3 px-4 font-medium">Customer</th>
                <th className="text-left py-3 px-4 font-medium">Service</th>
                <th className="text-left py-3 px-4 font-medium">Stylist</th>
                <th className="text-left py-3 px-4 font-medium">When</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Amount</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={7} className="p-4">
                      <div className="h-8 rounded shimmer-bg animate-shimmer" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-12">No bookings match these filters.</td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="border-t border-border align-top">
                  <td className="py-3 px-4">
                    <div className="font-medium">{b.customer_name}</div>
                    <div className="text-xs text-muted">{b.phone}</div>
                    {b.notes && <div className="text-xs text-muted italic mt-1">"{b.notes}"</div>}
                  </td>
                  <td className="py-3 px-4">{serviceName(b.service_id)}</td>
                  <td className="py-3 px-4">{stylistName(b.stylist_id)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br />
                    <span className="text-xs text-muted">{fmtTime12(b.time)}</span>
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                  <td className="py-3 px-4 text-right font-medium">{inr(b.price)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1">
                      {b.status !== 'confirmed' && b.status !== 'completed' && (
                        <button onClick={() => setStatus(b, 'confirmed')} title="Confirm" className="btn-ghost btn-sm">
                          <Check className="h-4 w-4 text-emerald-700" />
                        </button>
                      )}
                      {b.status !== 'completed' && (
                        <button onClick={() => setStatus(b, 'completed')} title="Mark complete" className="btn-ghost btn-sm">
                          <Check className="h-4 w-4 text-blue-700" />
                          <Check className="h-4 w-4 -ml-2 text-blue-700" />
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button onClick={() => setStatus(b, 'cancelled')} title="Cancel" className="btn-ghost btn-sm">
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-red-100 text-red-900',
    completed: 'bg-blue-100 text-blue-900',
    no_show: 'bg-zinc-200 text-zinc-700',
  };
  return <span className={'badge ' + map[status]}>{status.replace('_', ' ')}</span>;
}
