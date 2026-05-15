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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <header className="mb-6 sm:mb-8 hidden lg:flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow-ink">Overview</p>
          <h1 className="font-display text-3xl sm:text-[34px] tracking-tight mt-2">
            {greeting}.
          </h1>
          <p className="text-muted text-sm mt-1.5">
            Here's what's happening at the salon.
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </header>

      <div className="lg:hidden flex items-baseline justify-between mb-4 gap-2">
        <div>
          <p className="eyebrow-ink">Last {periodDays} days</p>
          <h2 className="font-display text-2xl mt-1">{greeting}</h2>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-7">
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

      {/* Chart + Status mix */}
      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-7">
        <Panel className="lg:col-span-2">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
            <div className="min-w-0">
              <p className="eyebrow-ink">Trend</p>
              <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
                Bookings &amp; revenue
              </h2>
              <p className="text-xs text-muted mt-1 tabular-nums">
                {stats.periodCount} bookings · {inr(stats.periodRevenue)} · last {periodDays} days
              </p>
            </div>
            <Legend />
          </div>
          {loading ? (
            <div className="h-28 sm:h-36 shimmer-bg animate-shimmer rounded-lg" />
          ) : (
            <DualChart series={series} />
          )}
        </Panel>

        <Panel>
          <p className="eyebrow-ink">Distribution</p>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">Status mix</h2>
          <p className="text-xs text-muted mt-1">
            {statusBreakdown.total} bookings · last {periodDays} days
          </p>
          <div className="mt-5 space-y-3">
            {statusBreakdown.buckets.map((b) => (
              <StatusBar key={b.status} status={b.status} count={b.count} total={statusBreakdown.denom} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-7">
        <Panel>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="eyebrow-ink">Most booked</p>
              <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1 flex items-center gap-2">
                <Scissors className="h-4 w-4 text-accent" /> Top services
              </h2>
            </div>
            <Link
              to="/admin/services"
              className="text-xs text-muted hover:text-ink inline-flex items-center gap-1 mt-1.5"
            >
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <SkeletonRows />
          ) : topServices.length === 0 ? (
            <EmptyHint>No bookings in this period.</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {topServices.map((s, i) => {
                const max = topServices[0].count || 1;
                const pct = (s.count / max) * 100;
                return (
                  <li key={s.name} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="truncate flex items-baseline gap-2">
                        <span className="font-display text-accent tabular-nums text-[15px]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-ink/90">{s.name}</span>
                      </span>
                      <span className="text-xs text-muted shrink-0 tabular-nums">
                        {s.count} · {inr(s.revenue)}
                      </span>
                    </div>
                    <div className="h-[3px] rounded-full bg-ink/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <p className="eyebrow-ink">Schedule</p>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" /> Busy hours
          </h2>
          <p className="text-xs text-muted mt-1">Bookings by start time</p>
          {loading ? (
            <div className="mt-5 h-24 shimmer-bg animate-shimmer rounded-lg" />
          ) : (
            <HourChart buckets={hourBuckets} />
          )}
        </Panel>

        {site.sections.stylists ? (
          <Panel>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="eyebrow-ink">Top performers</p>
                <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> Stylists
                </h2>
              </div>
              <Link
                to="/admin/stylists"
                className="text-xs text-muted hover:text-ink inline-flex items-center gap-1 mt-1.5"
              >
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <SkeletonRows />
            ) : topStylists.length === 0 ? (
              <EmptyHint>No stylist bookings yet.</EmptyHint>
            ) : (
              <ul className="space-y-3">
                {topStylists.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <div className="h-9 w-9 rounded-full bg-accent/15 text-accent grid place-items-center font-semibold shrink-0 font-display">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="text-xs text-muted tabular-nums">
                        {s.count} bookings · {inr(s.revenue)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <ActionNeeded pendingList={pendingList} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        {site.sections.stylists && <ActionNeeded pendingList={pendingList} />}

        <Panel
          className={cn(site.sections.stylists ? 'lg:col-span-2' : 'lg:col-span-3')}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="eyebrow-ink">Coming up</p>
              <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
                Upcoming bookings
              </h2>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs text-muted hover:text-ink inline-flex items-center gap-1 mt-1.5"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : upcoming.length === 0 ? (
            <EmptyHint>No upcoming bookings yet.</EmptyHint>
          ) : (
            <ul className="divide-y divide-ink/[0.08]">
              {upcoming.map((b) => (
                <li key={b.id} className="py-3 flex items-center gap-3">
                  <div className="flex flex-col items-center text-center w-10 shrink-0">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                      {new Date(b.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="font-display text-lg leading-none tabular-nums mt-0.5">
                      {new Date(b.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{b.customer_name}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-xs text-muted mt-0.5 tabular-nums">
                      {fmtTime12(b.time)} · {b.phone}
                    </div>
                  </div>
                  <span className="font-display text-base shrink-0 tabular-nums">
                    {inr(b.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink/[0.08] bg-surface p-5 sm:p-6 shadow-soft',
        className,
      )}
    >
      {children}
    </div>
  );
}

function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 bg-surface p-0.5 text-xs">
      {(['7', '30', '90'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'rounded-full px-3 py-1 font-medium tracking-wide transition',
            value === p ? 'bg-ink text-primary-fg' : 'text-muted hover:text-ink',
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
    <div className="rounded-2xl border border-ink/[0.08] bg-surface p-4 sm:p-5 shadow-soft transition hover:border-ink/25">
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="eyebrow-ink">{label}</div>
        <span className="h-8 w-8 grid place-items-center rounded-full bg-ink/[0.05] text-muted shrink-0">
          {icon}
        </span>
      </div>
      <div className="font-display text-2xl sm:text-3xl leading-none tabular-nums truncate">
        {value}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 min-h-[18px]">
        {sub ? <span className="text-[11px] text-muted uppercase tracking-wide">{sub}</span> : <span />}
        {delta !== undefined && <DeltaPill value={delta} />}
      </div>
    </div>
  );
}

function DeltaPill({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-[10px] text-muted tracking-wide">No prior</span>;
  }
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : ArrowRight;
  const cls = up
    ? 'text-emerald-700'
    : down
    ? 'text-red-700'
    : 'text-muted';
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums', cls)}>
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}
      {value}%
    </span>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-muted shrink-0">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1 rounded-sm bg-ink" /> bookings
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1 rounded-sm bg-accent" /> revenue
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
      <div className="flex items-end gap-1 h-28 sm:h-36">
        {series.map((s) => {
          const isToday = s.date === todayIso;
          const countPct = (s.count / maxCount) * 100;
          const revenuePct = (s.revenue / maxRevenue) * 100;
          return (
            <div
              key={s.date}
              className="flex-1 h-full flex items-end justify-center gap-[3px] min-w-0 group relative"
            >
              <div className="absolute left-1/2 -translate-x-1/2 -top-9 hidden group-hover:flex flex-col items-center text-[10px] text-ink bg-surface border border-ink/15 rounded-lg px-2 py-1 shadow-soft whitespace-nowrap z-10">
                <span className="font-medium">
                  {s.label.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-muted tabular-nums">
                  {s.count} · {inr(s.revenue)}
                </span>
              </div>
              <div
                aria-label={`${s.count} bookings`}
                className={cn(
                  'w-1/2 rounded-t-sm transition-colors',
                  s.count === 0 ? 'bg-ink/[0.08]' : isToday ? 'bg-accent' : 'bg-ink group-hover:bg-ink/85',
                )}
                style={{ height: `${Math.max(s.count === 0 ? 3 : 6, countPct)}%` }}
              />
              <div
                aria-label={`Revenue ${inr(s.revenue)}`}
                className="w-1/3 rounded-t-sm bg-accent/65 group-hover:bg-accent transition-colors"
                style={{ height: `${Math.max(s.revenue === 0 ? 3 : 6, revenuePct)}%` }}
              />
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex mt-2 pt-2 border-t border-ink/[0.08]">
          {series.map((s) => (
            <div key={s.date} className="flex-1 text-center text-[10px] text-muted uppercase tracking-wider">
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
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="capitalize text-ink/80">{status.replace('_', ' ')}</span>
        <span className="tabular-nums text-muted">
          <span className="text-ink font-medium">{count}</span> · {pct}%
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-ink/[0.06] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', colors[status])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HourChart({ buckets }: { buckets: { hour: number; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="mt-5">
      <div className="flex items-end gap-1 h-24 relative">
        {buckets.map((b) => {
          const pct = (b.count / max) * 100;
          const peak = b.count === max && b.count > 0;
          return (
            <div key={b.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -translate-y-7 hidden group-hover:block text-[10px] text-ink bg-surface border border-ink/15 rounded-md px-1.5 py-0.5 whitespace-nowrap z-10 shadow-soft">
                {fmtTime12(`${String(b.hour).padStart(2, '0')}:00`)} · {b.count}
              </div>
              <div className="w-full h-full flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all',
                    b.count === 0 ? 'bg-ink/[0.08]' : peak ? 'bg-accent' : 'bg-ink/70 group-hover:bg-ink',
                  )}
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2 pt-2 border-t border-ink/[0.08]">
        {buckets.map((b, i) => (
          <div key={b.hour} className="flex-1 text-center text-[9px] text-muted tabular-nums">
            {i % 2 === 0 ? fmtTime12(`${String(b.hour).padStart(2, '0')}:00`).replace(' ', '') : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionNeeded({ pendingList }: { pendingList: Booking[] }) {
  const has = pendingList.length > 0;
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 sm:p-6 shadow-soft',
        has ? 'bg-accent/[0.06] border-accent/40' : 'bg-surface border-ink/[0.08]',
      )}
    >
      <p className="eyebrow-ink">Awaiting you</p>
      <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-accent" /> Action needed
      </h2>
      {!has ? (
        <p className="text-sm text-muted mt-4">All caught up — no pending bookings.</p>
      ) : (
        <>
          <p className="text-xs text-muted mt-1.5 tabular-nums">
            {pendingList.length} {pendingList.length === 1 ? 'booking needs' : 'bookings need'} confirmation
          </p>
          <ul className="mt-4 space-y-2.5">
            {pendingList.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-dotted border-ink/15 pb-2 last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.customer_name}</div>
                  <div className="text-xs text-muted tabular-nums">
                    {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                    {fmtTime12(b.time)}
                  </div>
                </div>
                <span className="font-display text-base shrink-0 tabular-nums">{inr(b.price)}</span>
              </li>
            ))}
          </ul>
          <Link to="/admin/bookings" className="mt-5 btn-outline btn-sm w-full">
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
