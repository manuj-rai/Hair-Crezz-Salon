import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Clock, IndianRupee, Users } from 'lucide-react';
import { repo } from '../../lib/repo';
import type { Booking } from '../../types/db';
import { fmtTime12, inr, isoDate } from '../../lib/utils';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    repo.listBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  const today = isoDate(new Date());
  const stats = useMemo(() => {
    const list = bookings ?? [];
    return {
      todayCount: list.filter((b) => b.date === today && b.status !== 'cancelled').length,
      pending: list.filter((b) => b.status === 'pending').length,
      todayRevenue: list.filter((b) => b.date === today && b.status !== 'cancelled').reduce((s, b) => s + b.price, 0),
      total: list.length,
    };
  }, [bookings, today]);

  const upcoming = (bookings ?? [])
    .filter((b) => b.status !== 'cancelled' && b.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl">Welcome back.</h1>
        <p className="text-muted mt-1">Here's what's happening at the salon today.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Today's bookings" value={stats.todayCount} icon={<CalendarCheck className="h-5 w-5" />} />
        <Stat label="Pending confirmation" value={stats.pending} icon={<Clock className="h-5 w-5" />} accent />
        <Stat label="Today's revenue" value={inr(stats.todayRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
        <Stat label="All-time bookings" value={stats.total} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Upcoming bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!bookings ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg shimmer-bg animate-shimmer" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">No upcoming bookings yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-6 font-medium">Customer</th>
                  <th className="text-left py-2 px-6 font-medium">When</th>
                  <th className="text-left py-2 px-6 font-medium">Status</th>
                  <th className="text-right py-2 px-6 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-6">
                      <div className="font-medium">{b.customer_name}</div>
                      <div className="text-xs text-muted">{b.phone}</div>
                    </td>
                    <td className="py-3 px-6">
                      {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmtTime12(b.time)}
                    </td>
                    <td className="py-3 px-6"><StatusBadge status={b.status} /></td>
                    <td className="py-3 px-6 text-right font-medium">{inr(b.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: React.ReactNode; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
          <div className="text-2xl font-display mt-2">{value}</div>
        </div>
        <div className={'h-9 w-9 rounded-lg grid place-items-center ' + (accent ? 'bg-accent/15 text-accent' : 'bg-bg text-muted')}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], string> = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-red-100 text-red-900',
    completed: 'bg-blue-100 text-blue-900',
    no_show: 'bg-zinc-200 text-zinc-700',
  };
  return <span className={'badge ' + map[status]}>{status.replace('_', ' ')}</span>;
}
