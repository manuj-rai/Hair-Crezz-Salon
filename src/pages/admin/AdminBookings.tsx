import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Booking, BookingStatus, Service, Stylist } from '../../types/db';
import { fmtTime12, inr, isoDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { generateSlots, type Slot } from '../../lib/slots';
import { site } from '../../config/site';

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
  const [adding, setAdding] = useState(false);

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
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Bookings</h1>
          <p className="text-muted mt-1">Confirm, cancel and complete appointments.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add booking
        </button>
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

      {adding && (
        <AddBookingModal
          services={services.filter((s) => s.active)}
          stylists={stylists.filter((s) => s.active)}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </div>
  );
}

type BookingDraft = {
  customer_name: string;
  phone: string;
  email: string;
  service_id: string;
  stylist_id: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
};

function AddBookingModal({
  services,
  stylists,
  onClose,
  onCreated,
}: {
  services: Service[];
  stylists: Stylist[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [draft, setDraft] = useState<BookingDraft>({
    customer_name: '',
    phone: '',
    email: '',
    service_id: services[0]?.id ?? '',
    stylist_id: 'any',
    date: isoDate(new Date()),
    time: '',
    notes: '',
    status: 'confirmed',
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const service = services.find((s) => s.id === draft.service_id) ?? null;
  const stylistId = site.sections.stylists && draft.stylist_id !== 'any' ? draft.stylist_id : null;

  useEffect(() => {
    if (!service || !draft.date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setDraft((current) => ({ ...current, time: '' }));
    const date = new Date(`${draft.date}T00:00:00`);
    Promise.all([
      repo.listHours(),
      repo.listBookedTimes(draft.date, stylistId),
      repo.listBlocked(draft.date),
    ])
      .then(([hours, booked, blocked]) => {
        const hour = hours.find((h) => h.day_of_week === date.getDay());
        setSlots(generateSlots({ date, hour, durationMin: service.duration_min, bookings: booked, blocked, now: new Date(0) }));
      })
      .catch(() => {
        setSlots([]);
        toast.error('Could not load available times');
      })
      .finally(() => setLoadingSlots(false));
  }, [draft.date, draft.service_id, service, stylistId]);

  async function save() {
    if (!service) {
      toast.error('Select a service');
      return;
    }
    if (!draft.customer_name.trim() || !draft.phone.trim() || !draft.date || !draft.time) {
      toast.error('Fill customer, phone, date and time');
      return;
    }

    setSaving(true);
    try {
      await repo.createBooking({
        customer_name: draft.customer_name.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim() || null,
        service_id: service.id,
        stylist_id: stylistId,
        date: draft.date,
        time: draft.time,
        duration_min: service.duration_min,
        price: service.price,
        notes: draft.notes.trim() || null,
        status: draft.status,
      });
      toast.success('Booking added');
      onCreated();
    } catch (e) {
      console.error(e);
      toast.error('Could not add booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl mb-4">Add booking</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Customer name</label>
            <input className="input" value={draft.customer_name} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email optional</label>
            <input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BookingStatus })}>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="label">Service</label>
            <select className="input" value={draft.service_id} onChange={(e) => setDraft({ ...draft, service_id: e.target.value })}>
              <option value="" disabled>Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {inr(s.price)}</option>
              ))}
            </select>
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
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Time</label>
            <select className="input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })}>
              <option value="">{loadingSlots ? 'Loading times...' : 'Select time'}</option>
              {slots.filter((s) => s.available).map((slot) => (
                <option key={slot.time} value={slot.time}>{fmtTime12(slot.time)}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes optional</label>
            <textarea className="textarea" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 text-sm text-muted">
          {service ? `${service.duration_min} min · ${inr(service.price)}` : 'Select a service to see available times.'}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving || !service || !draft.time}>
            {saving ? 'Saving...' : 'Save booking'}
          </button>
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
