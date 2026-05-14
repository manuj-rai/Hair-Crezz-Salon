import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Clock,
  IndianRupee,
  Scissors,
  TrendingUp,
  Users,
} from 'lucide-react';
import { repo } from '../../lib/repo';
import type { Booking, BookingStatus, Service, Stylist } from '../../types/db';
import { site } from '../../config/site';
import { fmtTime12, inr, isoDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { StatusBadge } from './ui';

type Period = '7' | '30' | '90';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [period, setPeriod] = useState<Period>('7');

  useEffect(() => {
    Promise.all([
      repo.listBookings(),
      repo.listServices(false),
      site.sections.stylists ? repo.listStylists(false) : Promise.resolve<Stylist[]>([]),
    ])
      .then(([b, s, st]) => {
        setBookings(b);
        setServices(s);
        setStylists(st);
      })
      .catch(() => setBookings([]));
  }, []);

  const today = isoDate(new Date());
  const list = useMemo(() => bookings ?? [], [bookings]);
  const pendingList = useMemo(() => list.filter((b) => b.status === 'pending'), [list]);
  const counted = useMemo(() => list.filter((b) => b.status !== 'cancelled'), [list]);

  // -------- current vs previous period ------------------------------------
  const periodDays = Number(period);
  const { periodStart, prevStart } = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - (periodDays - 1));
    start.setHours(0, 0, 0, 0);
    const prev = new Date(start);
    prev.setDate(prev.getDate() - periodDays);
    return { periodStart: start, prevStart: prev };
  }, [periodDays]);
  const periodStartISO = isoDate(periodStart);
  const prevStartISO = isoDate(prevStart);

  const currWindow = useMemo(
    () => counted.filter((b) => b.date >= periodStartISO && b.date <= today),
    [counted, periodStartISO, today],
  );
  const prevWindow = useMemo(
    () => counted.filter((b) => b.date >= prevStartISO && b.date < periodStartISO),
    [counted, prevStartISO, periodStartISO],
  );

  const stats = useMemo(() => {
    const todayBookings = counted.filter((b) => b.date === today);
    const periodRevenue = currWindow.reduce((s, b) => s + b.price, 0);
    const prevPeriodRevenue = prevWindow.reduce((s, b) => s + b.price, 0);
    return {
      todayCount: todayBookings.length,
      todayRevenue: todayBookings.reduce((s, b) => s + b.price, 0),
      pending: pendingList.length,
      periodCount: currWindow.length,
      periodRevenue,
      bookingsDelta: pctDelta(currWindow.length, prevWindow.length),
      revenueDelta: pctDelta(periodRevenue, prevPeriodRevenue),
    };
  }, [counted, currWindow, prevWindow, pendingList.length, today]);

  // -------- daily series for chart ----------------------------------------
  const series = useMemo(() => {
    const buckets = Array.from({ length: periodDays }, (_, i) => {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + i);
      return { date: isoDate(d), label: d, count: 0, revenue: 0 };
    });
    const byDate = new Map(buckets.map((b) => [b.date, b]));
    for (const b of currWindow) {
      const bucket = byDate.get(b.date);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += b.price;
      }
    }
    return buckets;
  }, [currWindow, periodStart, periodDays]);

  // -------- status breakdown ----------------------------------------------
  const statusBreakdown = useMemo(() => {
    const inWindow = list.filter((b) => b.date >= periodStartISO && b.date <= today);
    const total = inWindow.length || 1;
    const buckets: { status: BookingStatus; count: number }[] = (
      ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as BookingStatus[]
    ).map((status) => ({ status, count: inWindow.filter((b) => b.status === status).length }));
    return { buckets, total: inWindow.length, denom: total };
  }, [list, periodStartISO, today]);

  // -------- top services ---------------------------------------------------
  const topServices = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; revenue: number }>();
    for (const b of currWindow) {
      const svc = services.find((s) => s.id === b.service_id);
      const name = svc?.name ?? 'Unknown service';
      const e = counts.get(name) ?? { name, count: 0, revenue: 0 };
      e.count += 1;
      e.revenue += b.price;
      counts.set(name, e);
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [currWindow, services]);

  // -------- top stylists ---------------------------------------------------
  const topStylists = useMemo(() => {
    if (!site.sections.stylists) return [];
    const counts = new Map<string, { id: string; name: string; count: number; revenue: number }>();
    for (const b of currWindow) {
      const key = b.stylist_id ?? 'any';
      const name =
        b.stylist_id ? stylists.find((s) => s.id === b.stylist_id)?.name ?? 'Stylist' : 'Any available';
      const e = counts.get(key) ?? { id: key, name, count: 0, revenue: 0 };
      e.count += 1;
      e.revenue += b.price;
      counts.set(key, e);
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [currWindow, stylists]);

  // -------- busiest hours --------------------------------------------------
  const hourBuckets = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({ hour: i + 9, count: 0 })); // 9am..8pm
    for (const b of currWindow) {
      const h = parseInt(b.time.slice(0, 2), 10);
      const idx = h - 9;
      if (idx >= 0 && idx < buckets.length) buckets[idx].count += 1;
    }
    return buckets;
  }, [currWindow]);

  const upcoming = useMemo(
    () =>
      list
        .filter((b) => b.status !== 'cancelled' && b.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 6),
    [list, today],
  );

  const loading = bookings === null;

  return (
    <div>
      <header className="mb-4 sm:mb-6 hidden lg:flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Welcome back.</h1>
          <p className="text-muted text-sm mt-1">Here's what's happening at the salon.</p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </header>

      <div className="lg:hidden flex items-center justify-between mb-3 gap-2">
        <p className="text-xs text-muted">Showing last {periodDays} days</p>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Stat
          label="Today"
          value={stats.todayCount}
          sub="bookings"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <Stat
          label="Today"
          value={inr(stats.todayRevenue)}
          sub="revenue"
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <Stat
          label={`Last ${periodDays}d`}
          value={stats.periodCount}
          sub="bookings"
          delta={stats.bookingsDelta}
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label={`Last ${periodDays}d`}
          value={inr(stats.periodRevenue)}
          sub="revenue"
          delta={stats.revenueDelta}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> Bookings &amp; revenue
              </h2>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                {stats.periodCount} bookings · {inr(stats.periodRevenue)} in last {periodDays} days
              </p>
            </div>
            <Legend />
          </div>
          {loading ? (
            <div className="h-24 sm:h-32 shimmer-bg animate-shimmer rounded" />
          ) : (
            <DualChart series={series} />
          )}
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="font-display text-base sm:text-xl">Status mix</h2>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5">
            {statusBreakdown.total} bookings in last {periodDays} days
          </p>
          <div className="mt-4 space-y-2.5">
            {statusBreakdown.buckets.map((b) => (
              <StatusBar key={b.status} status={b.status} count={b.count} total={statusBreakdown.denom} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
              <Scissors className="h-4 w-4 text-accent" /> Top services
            </h2>
            <Link to="/admin/services" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <SkeletonRows />
          ) : topServices.length === 0 ? (
            <EmptyHint>No bookings in this period.</EmptyHint>
          ) : (
            <ul className="space-y-2">
              {topServices.map((s, i) => {
                const max = topServices[0].count || 1;
                const pct = (s.count / max) * 100;
                return (
                  <li key={s.name} className="text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="truncate"><span className="text-muted text-xs mr-1.5">#{i + 1}</span>{s.name}</span>
                      <span className="text-xs text-muted shrink-0">{s.count} · {inr(s.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                      <div className="h-full bg-accent/80 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-accent" /> Busy hours
          </h2>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5">Bookings by start time</p>
          {loading ? (
            <div className="mt-4 h-24 shimmer-bg animate-shimmer rounded" />
          ) : (
            <HourChart buckets={hourBuckets} />
          )}
        </div>

        {site.sections.stylists ? (
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent" /> Top stylists
              </h2>
              <Link to="/admin/stylists" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <SkeletonRows />
            ) : topStylists.length === 0 ? (
              <EmptyHint>No stylist bookings yet.</EmptyHint>
            ) : (
              <ul className="space-y-2.5">
                {topStylists.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-accent/10 text-accent grid place-items-center font-semibold shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="text-xs text-muted">{s.count} bookings · {inr(s.revenue)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ActionNeeded pendingList={pendingList} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        {site.sections.stylists && <ActionNeeded pendingList={pendingList} />}

        <div className={cn('card p-4 sm:p-5', site.sections.stylists ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base sm:text-xl">Upcoming bookings</h2>
            <Link to="/admin/bookings" className="text-xs sm:text-sm text-muted hover:text-ink inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : upcoming.length === 0 ? (
            <EmptyHint>No upcoming bookings yet.</EmptyHint>
          ) : (
            <ul className="divide-y divide-border -mx-4 sm:mx-0">
              {upcoming.map((b) => (
                <li key={b.id} className="px-4 sm:px-0 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{b.customer_name}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                      {fmtTime12(b.time)} · {b.phone}
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0 tabular-nums">{inr(b.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-0.5 text-xs">
      {(['7', '30', '90'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'rounded-full px-2.5 py-1 font-medium transition',
            value === p ? 'bg-primary text-primary-fg' : 'text-muted hover:text-ink',
          )}
        >
          {p}d
        </button>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  delta?: number | null;
}) {
  return (
    <div className="card p-3 sm:p-4 hover:border-ink transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted leading-tight">{label}</div>
          <div className="text-lg sm:text-2xl font-display mt-0.5 sm:mt-1 leading-tight truncate">{value}</div>
          {sub && <div className="text-[10px] sm:text-xs text-muted">{sub}</div>}
        </div>
        <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg grid place-items-center shrink-0 bg-bg text-muted">
          {icon}
        </div>
      </div>
      {delta !== undefined && <DeltaPill value={delta} />}
    </div>
  );
}

function DeltaPill({ value }: { value: number | null }) {
  if (value === null) {
    return <div className="text-[10px] sm:text-xs text-muted mt-1.5">No prior data</div>;
  }
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : ArrowRight;
  const cls = up
    ? 'text-emerald-700 bg-emerald-50 ring-emerald-200/70'
    : down
    ? 'text-red-700 bg-red-50 ring-red-200/70'
    : 'text-muted bg-bg ring-border';
  return (
    <span
      className={cn(
        'mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium ring-1 ring-inset',
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}
      {value}% vs prev
    </span>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted shrink-0">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1.5 rounded-sm bg-primary/80" /> bookings
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1.5 rounded-sm bg-accent/70" /> revenue
      </span>
    </div>
  );
}

function DualChart({ series }: { series: { date: string; label: Date; count: number; revenue: number }[] }) {
  const n = series.length;
  const maxCount = Math.max(1, ...series.map((s) => s.count));
  const maxRevenue = Math.max(1, ...series.map((s) => s.revenue));
  const showLabels = n <= 14;
  const todayIso = isoDate(new Date());

  return (
    <div>
      <div className="flex items-end gap-1 h-24 sm:h-32">
        {series.map((s) => {
          const isToday = s.date === todayIso;
          const countPct = (s.count / maxCount) * 100;
          const revenuePct = (s.revenue / maxRevenue) * 100;
          return (
            <div key={s.date} className="flex-1 h-full flex items-end justify-center gap-[2px] min-w-0 group relative">
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-7 hidden group-hover:flex flex-col items-center text-[10px] text-ink bg-surface border border-border rounded-md px-1.5 py-1 shadow-soft whitespace-nowrap z-10"
              >
                <span className="font-medium">
                  {s.label.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-muted">
                  {s.count} bookings · {inr(s.revenue)}
                </span>
              </div>
              <div
                aria-label={`${s.count} bookings`}
                className={cn(
                  'w-1/2 rounded-t transition-colors',
                  s.count === 0
                    ? 'bg-border/60'
                    : isToday
                    ? 'bg-accent'
                    : 'bg-primary/80 group-hover:bg-primary',
                )}
                style={{ height: `${Math.max(s.count === 0 ? 4 : 6, countPct)}%` }}
              />
              <div
                aria-label={`Revenue ${inr(s.revenue)}`}
                className="w-1/3 rounded-t bg-accent/70 group-hover:bg-accent transition-colors"
                style={{ height: `${Math.max(s.revenue === 0 ? 4 : 6, revenuePct)}%` }}
              />
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex mt-1">
          {series.map((s) => (
            <div key={s.date} className="flex-1 text-center text-[10px] text-muted">
              {s.label.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBar({ status, count, total }: { status: BookingStatus; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors: Record<BookingStatus, string> = {
    pending: 'bg-amber-500',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500',
    no_show: 'bg-zinc-400',
  };
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="capitalize text-muted">{status.replace('_', ' ')}</span>
        <span className="tabular-nums text-ink font-medium">{count} <span className="text-muted font-normal">· {pct}%</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-bg overflow-hidden">
        <div className={cn('h-full rounded-full transition-[width] duration-500', colors[status])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HourChart({ buckets }: { buckets: { hour: number; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="mt-3">
      <div className="flex items-end gap-1 h-20">
        {buckets.map((b) => {
          const pct = (b.count / max) * 100;
          const peak = b.count === max && b.count > 0;
          return (
            <div key={b.hour} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="absolute -translate-y-7 hidden group-hover:block text-[10px] text-ink bg-surface border border-border rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {fmtTime12(`${String(b.hour).padStart(2, '0')}:00`)} · {b.count}
              </div>
              <div className="w-full h-full flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    b.count === 0 ? 'bg-border/60' : peak ? 'bg-accent' : 'bg-primary/70 group-hover:bg-primary',
                  )}
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {buckets.map((b, i) => (
          <div key={b.hour} className="flex-1 text-center text-[9px] text-muted">
            {i % 2 === 0 ? fmtTime12(`${String(b.hour).padStart(2, '0')}:00`).replace(' ', '') : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionNeeded({ pendingList }: { pendingList: Booking[] }) {
  return (
    <div className={cn('card p-4 sm:p-5', pendingList.length > 0 && 'bg-accent/5 border-accent/40')}>
      <h2 className="font-display text-base sm:text-xl flex items-center gap-1.5">
        <AlertCircle className="h-4 w-4 text-accent" /> Action needed
      </h2>
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
                    {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                    {fmtTime12(b.time)}
                  </div>
                </div>
                <span className="font-medium text-sm shrink-0 tabular-nums">{inr(b.price)}</span>
              </li>
            ))}
          </ul>
          <Link to="/admin/bookings" className="mt-4 btn-outline btn-sm w-full">
            Review all <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg shimmer-bg animate-shimmer" />
      ))}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted py-6 text-center">{children}</p>;
}
