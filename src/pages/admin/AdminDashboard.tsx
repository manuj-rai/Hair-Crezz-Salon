import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CalendarCheck, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { repo } from '../../lib/repo';
import type { Booking } from '../../types/db';
import { fmtTime12, inr, isoDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { StatusBadge } from './ui';

type Period = '7' | '30' | '90';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [period, setPeriod] = useState<Period>('7');

  useEffect(() => {
    repo.listBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  const today = isoDate(new Date());
  const list = bookings ?? [];

  const pendingList = list.filter((b) => b.status === 'pending');

  const stats = useMemo(() => {
    return {
      todayCount: list.filter((b) => b.date === today && b.status !== 'cancelled').length,
      pending: pendingList.length,
      todayRevenue: list
        .filter((b) => b.date === today && b.status !== 'cancelled')
        .reduce((s, b) => s + b.price, 0),
      total: list.length,
    };
  }, [list, today, pendingList.length]);

  const periodDays = Number(period);
  const periodStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (periodDays - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [periodDays]);

  const series = useMemo(() => {
    const buckets = Array.from({ length: periodDays }, (_, i) => {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + i);
      return { date: isoDate(d), label: d, count: 0, revenue: 0 };
    });
    const byDate = new Map(buckets.map((b) => [b.date, b]));
    for (const b of list) {
      if (b.status === 'cancelled') continue;
      const bucket = byDate.get(b.date);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += b.price;
      }
    }
    return buckets;
  }, [list, periodStart, periodDays]);

  const periodTotals = useMemo(() => ({
    count: series.reduce((s, x) => s + x.count, 0),
    revenue: series.reduce((s, x) => s + x.revenue, 0),
  }), [series]);

  const upcoming = useMemo(
    () => list
      .filter((b) => b.status !== 'cancelled' && b.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 6),
    [list, today],
  );

  return (
    <div>
      <header className="mb-4 sm:mb-6 hidden lg:block">
        <h1 className="font-display text-2xl sm:text-3xl">Welcome back.</h1>
        <p className="text-muted text-sm mt-1">Here's what's happening at the salon today.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Stat label="Today" value={stats.todayCount} icon={<CalendarCheck className="h-4 w-4" />} sub="bookings" />
        <Stat
          label="Pending"
          value={stats.pending}
          icon={<AlertCircle className="h-4 w-4" />}
          accent={stats.pending > 0}
          href={stats.pending > 0 ? '/admin/bookings' : undefined}
          sub="action"
        />
        <Stat label="Today" value={inr(stats.todayRevenue)} icon={<IndianRupee className="h-4 w-4" />} sub="revenue" />
        <Stat label="All-time" value={stats.total} icon={<Users className="h-4 w-4" />} sub="bookings" />
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> Bookings & revenue
              </h2>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                {periodTotals.count} bookings · {inr(periodTotals.revenue)} in last {periodDays} days
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {(['7', '30', '90'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs border whitespace-nowrap transition',
                    period === p ? 'bg-primary text-primary-fg border-primary' : 'border-border text-muted hover:text-ink',
                  )}
                >
                  {p}d
                </button>
              ))}
            </div>
          </div>
          <Sparkline series={series} />
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="font-display text-base sm:text-xl">Action needed</h2>
          {pendingList.length === 0 ? (
            <p className="text-sm text-muted mt-3">No pending bookings — all caught up.</p>
          ) : (
            <>
              <p className="text-xs text-muted mt-1">
                {pendingList.length} {pendingList.length === 1 ? 'booking needs' : 'bookings need'} confirmation.
              </p>
              <ul className="mt-3 space-y-2">
                {pendingList.slice(0, 4).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{b.customer_name}</div>
                      <div className="text-xs text-muted">
                        {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmtTime12(b.time)}
                      </div>
                    </div>
                    <span className="font-medium text-sm shrink-0">{inr(b.price)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/admin/bookings" className="mt-4 btn-outline btn-sm w-full">
                Review all <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base sm:text-xl">Upcoming bookings</h2>
          <Link to="/admin/bookings" className="text-xs sm:text-sm text-muted hover:text-ink inline-flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
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
          <ul className="divide-y divide-border -mx-4 sm:mx-0">
            {upcoming.map((b) => (
              <li key={b.id} className="px-4 sm:px-0 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{b.customer_name}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmtTime12(b.time)} · {b.phone}
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0">{inr(b.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  accent,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  href?: string;
}) {
  const body = (
    <div className={cn('card p-3 sm:p-4 transition', accent && 'bg-accent/5 border-accent/40', href && 'hover:border-ink')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted leading-tight">{label}</div>
          <div className="text-lg sm:text-2xl font-display mt-0.5 sm:mt-1 leading-tight truncate">{value}</div>
          {sub && <div className="text-[10px] sm:text-xs text-muted">{sub}</div>}
        </div>
        <div className={'h-7 w-7 sm:h-9 sm:w-9 rounded-lg grid place-items-center shrink-0 ' + (accent ? 'bg-accent/15 text-accent' : 'bg-bg text-muted')}>
          {icon}
        </div>
      </div>
      {href && <div className="text-[10px] sm:text-xs text-accent mt-1 flex items-center gap-1">Review <ArrowRight className="h-3 w-3" /></div>}
    </div>
  );
  return href ? <Link to={href}>{body}</Link> : body;
}

function Sparkline({
  series,
}: {
  series: { date: string; label: Date; count: number; revenue: number }[];
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const showLabels = series.length <= 14;
  const todayIso = isoDate(new Date());
  return (
    <div className="flex items-end gap-1 h-24 sm:h-32">
      {series.map((s) => {
        const pct = (s.count / max) * 100;
        const isToday = s.date === todayIso;
        return (
          <div key={s.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div className="text-[10px] text-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">
              {s.count} · {inr(s.revenue)}
            </div>
            <div className="w-full flex items-end justify-center h-full">
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  s.count === 0 ? 'bg-border/60' : isToday ? 'bg-accent' : 'bg-primary/80 group-hover:bg-primary',
                )}
                style={{ height: `${Math.max(4, pct)}%` }}
              />
            </div>
            {showLabels && (
              <div className="text-[10px] text-muted">
                {s.label.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
