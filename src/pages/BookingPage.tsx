import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  Scissors,
  Sun,
  Sunrise,
  Sunset,
  User,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { repo } from '../lib/repo';
import type { Booking, Service, Stylist } from '../types/db';
import { cn, fmtTime12, inr, isoDate } from '../lib/utils';
import { generateSlots, type Slot } from '../lib/slots';
import { SERVICES_NOTE_PREFIX } from '../lib/booking';
import { site } from '../config/site';

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Services', 'Date & time', 'Your details'] as const;

const customerSchema = z.object({
  customer_name: z.string().min(2, 'Please enter your full name'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;
type FieldErrors = Partial<Record<keyof CustomerForm, { message?: string }>>;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function BookingPage() {
  const [params] = useSearchParams();
  const presetService = params.get('service');
  const presetStylist = params.get('stylist');
  const stylistsEnabled = site.sections.stylists;

  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>(presetService ? [presetService] : []);
  const [stylistId, setStylistId] = useState<string>(stylistsEnabled ? presetStylist ?? 'any' : 'any');
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  useEffect(() => {
    document.title = `Book — ${site.name}`;
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [step]);

  useEffect(() => {
    Promise.all([repo.listServices(), stylistsEnabled ? repo.listStylists() : Promise.resolve([])])
      .then(([s, st]) => {
        setServices(s);
        setStylists(st);
        if (presetService && !s.find((x) => x.id === presetService)) setServiceIds([]);
      })
      .catch(() => toast.error('Could not load services'));
  }, [presetService, stylistsEnabled]);

  const selectedServices = useMemo(
    () => serviceIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s)),
    [services, serviceIds],
  );
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration_min, 0),
    [selectedServices],
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices],
  );

  const stylist = useMemo(
    () => (stylistId === 'any' ? null : stylists.find((s) => s.id === stylistId) ?? null),
    [stylists, stylistId],
  );

  useEffect(() => {
    if (step !== 2 || selectedServices.length === 0) return;
    setLoadingSlots(true);
    setTime(null);
    const dow = date.getDay();
    Promise.all([
      repo.listHours(),
      repo.listBookedTimes(isoDate(date), stylist?.id ?? null),
      repo.listBlocked(isoDate(date)),
    ])
      .then(([hours, booked, blocked]) => {
        const hour = hours.find((h) => h.day_of_week === dow);
        setSlots(generateSlots({ date, hour, durationMin: totalDuration, bookings: booked, blocked }));
      })
      .catch(() => toast.error('Could not load availability'))
      .finally(() => setLoadingSlots(false));
  }, [step, date, stylist, totalDuration, selectedServices.length]);

  const form = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  function toggleService(id: string) {
    setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function submit(values: CustomerForm) {
    if (selectedServices.length === 0 || !time) return;
    setSubmitting(true);
    try {
      const userNotes = values.notes?.trim() || '';
      const composedNotes =
        selectedServices.length > 1
          ? `${SERVICES_NOTE_PREFIX}${selectedServices.map((s) => s.name).join(' + ')}${userNotes ? `\n\n${userNotes}` : ''}`
          : userNotes || null;
      const booking = await repo.createBooking({
        customer_name: values.customer_name,
        phone: values.phone,
        email: values.email || null,
        service_id: selectedServices[0].id,
        date: isoDate(date),
        time,
        duration_min: totalDuration,
        price: totalPrice,
        notes: composedNotes,
      });
      setConfirmed(booking);
      setStep(4);
    } catch (e) {
      console.error(e);
      toast.error('Could not create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 4 && confirmed) {
    return (
      <div className="min-h-full pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <Header />
        <main className="container-x py-10 sm:py-20 max-w-2xl">
          <ConfirmationView
            booking={confirmed}
            services={selectedServices}
            stylist={stylist}
            stylistsEnabled={stylistsEnabled}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const canContinue =
    step === 1 ? selectedServices.length > 0 : step === 2 ? Boolean(time) : true;

  function goNext() {
    if (!canContinue) return;
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }
  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  return (
    <div className="min-h-full pb-[calc(theme(spacing.20)+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />

      <main className="container-x py-5 sm:py-10 lg:py-14 max-w-6xl">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-5 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back home
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start">
          <div className="min-w-0">
            <Stepper step={step as 1 | 2 | 3} />

            <div key={step} className="mt-7 sm:mt-9 animate-fade-in">
              {step === 1 && (
                <ServicesStep
                  services={services}
                  selected={serviceIds}
                  onToggle={toggleService}
                  totalDuration={totalDuration}
                  totalPrice={totalPrice}
                />
              )}
              {step === 2 && (
                <WhenStep
                  date={date}
                  onDate={setDate}
                  slots={slots}
                  loading={loadingSlots}
                  time={time}
                  onTime={setTime}
                  stylistsEnabled={stylistsEnabled}
                  stylists={stylists}
                  stylistId={stylistId}
                  onStylist={setStylistId}
                />
              )}
              {step === 3 && (
                <DetailsStep
                  register={form.register}
                  errors={form.formState.errors}
                  onSubmit={form.handleSubmit(submit)}
                  submitting={submitting}
                  services={selectedServices}
                  date={date}
                  time={time}
                  stylist={stylist}
                  stylistsEnabled={stylistsEnabled}
                  totalDuration={totalDuration}
                  totalPrice={totalPrice}
                />
              )}
            </div>
          </div>

          <DesktopSummary
            step={step as 1 | 2 | 3}
            services={selectedServices}
            stylist={stylist}
            stylistsEnabled={stylistsEnabled}
            date={date}
            time={time}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            canContinue={canContinue}
            submitting={submitting}
            onBack={goBack}
            onNext={goNext}
            onSubmit={form.handleSubmit(submit)}
          />
        </div>
      </main>

      <ActionBar
        step={step as 1 | 2 | 3}
        servicesCount={selectedServices.length}
        totalDuration={totalDuration}
        totalPrice={totalPrice}
        time={time}
        canContinue={canContinue}
        submitting={submitting}
        onBack={goBack}
        onNext={goNext}
        onSubmit={form.handleSubmit(submit)}
      />

      <Footer />
    </div>
  );
}

// ----------------------------------------------------------------- Stepper

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="eyebrow-ink">Step {step} of {STEPS.length}</p>
          <h1 className="font-display text-2xl sm:text-3xl mt-1.5 tracking-tight">
            {STEPS[step - 1]}
          </h1>
        </div>
        <ol className="hidden sm:flex items-center gap-1 text-[11px] uppercase tracking-[0.2em]">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <li
                key={label}
                className={cn(
                  'px-2.5 py-1 rounded-full transition',
                  active && 'bg-ink text-primary-fg',
                  done && 'text-accent',
                  !active && !done && 'text-muted',
                )}
              >
                {done ? <Check className="h-3 w-3 inline -mt-0.5 mr-1" /> : `0${n}`} {label}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="h-[2px] w-full bg-ink/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Step 1

function ServicesStep({
  services,
  selected,
  onToggle,
  totalDuration,
  totalPrice,
}: {
  services: Service[];
  selected: string[];
  onToggle: (id: string) => void;
  totalDuration: number;
  totalPrice: number;
}) {
  const cats = useMemo(() => Array.from(new Set(services.map((s) => s.category))), [services]);
  const [activeCat, setActiveCat] = useState<string>('All');

  const tabs = useMemo(() => ['All', ...cats], [cats]);
  const visible = useMemo(
    () => (activeCat === 'All' ? services : services.filter((s) => s.category === activeCat)),
    [services, activeCat],
  );

  return (
    <div>
      <p className="text-muted text-sm sm:text-base mt-1 leading-relaxed max-w-[52ch]">
        Pick one or more. We'll add up the time and total automatically.
      </p>

      {/* Category chip rail */}
      <div className="mt-6 -mx-5 sm:-mx-6 fade-x">
        <div className="flex gap-2 overflow-x-auto px-5 sm:px-6 no-scrollbar">
          {tabs.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={cn('chip shrink-0', activeCat === c && 'chip-active')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Service grid */}
      {services.length === 0 ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] shimmer-bg animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visible.map((s) => {
            const sel = selected.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onToggle(s.id)}
                  aria-pressed={sel}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition',
                    sel
                      ? 'border-accent bg-accent/[0.06] shadow-soft'
                      : 'border-ink/10 hover:border-ink/40 bg-surface',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded-md border grid place-items-center shrink-0 transition',
                      sel ? 'bg-accent border-accent text-accent-fg' : 'border-ink/25',
                    )}
                  >
                    {sel && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-medium text-ink leading-snug truncate">
                        {s.name}
                      </span>
                      <span className="font-display text-[17px] tabular-nums shrink-0">
                        {inr(s.price)}
                      </span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-muted mt-0.5 inline-flex items-center gap-2">
                      <span>{s.category}</span>
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {s.duration_min} min
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Inline rolling total */}
      {selected.length > 0 && (
        <div className="mt-5 sm:mt-6 flex items-center justify-between gap-3 border-t border-ink/12 pt-4">
          <span className="text-sm text-muted">
            <span className="text-ink font-medium">
              {selected.length} {selected.length === 1 ? 'service' : 'services'}
            </span>
            {' · '}
            {totalDuration} min
          </span>
          <span className="font-display text-2xl tabular-nums">{inr(totalPrice)}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- Step 2

function WhenStep({
  date,
  onDate,
  slots,
  loading,
  time,
  onTime,
  stylistsEnabled,
  stylists,
  stylistId,
  onStylist,
}: {
  date: Date;
  onDate: (d: Date) => void;
  slots: Slot[] | null;
  loading: boolean;
  time: string | null;
  onTime: (t: string) => void;
  stylistsEnabled: boolean;
  stylists: Stylist[];
  stylistId: string;
  onStylist: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-muted text-sm sm:text-base mt-1 leading-relaxed max-w-[52ch]">
        Choose a day and a time that suits.
      </p>

      {stylistsEnabled && stylists.length > 0 && (
        <div className="mt-7">
          <div className="eyebrow-ink mb-3">Preferred stylist</div>
          <div className="-mx-5 sm:-mx-6 fade-x">
            <div className="flex gap-2 overflow-x-auto px-5 sm:px-6 no-scrollbar">
              <StylistChip
                name="Any"
                sub="First available"
                active={stylistId === 'any'}
                onClick={() => onStylist('any')}
              />
              {stylists.map((s) => (
                <StylistChip
                  key={s.id}
                  name={s.name}
                  sub={s.role}
                  photo={s.photo_url ?? undefined}
                  active={stylistId === s.id}
                  onClick={() => onStylist(s.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-7">
        <div className="eyebrow-ink mb-3">Date</div>
        <DateStrip date={date} onDate={onDate} />
      </div>

      <div className="mt-7">
        <div className="eyebrow-ink mb-3">Available times</div>
        <SlotPicker slots={slots} loading={loading} time={time} onTime={onTime} />
      </div>
    </div>
  );
}

function DateStrip({ date, onDate }: { date: Date; onDate: (d: Date) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = startOfDay(new Date());
  const max = new Date(today);
  max.setDate(max.getDate() + site.booking.advanceWindowDays - 1);

  const days = useMemo(() => {
    return Array.from({ length: site.booking.advanceWindowDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    if (typeof (el as { showPicker?: () => void }).showPicker === 'function') {
      (el as unknown as { showPicker: () => void }).showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  return (
    <div>
      <div className="-mx-5 sm:-mx-6 fade-x">
        <div className="flex gap-2 overflow-x-auto px-5 sm:px-6 pb-1 no-scrollbar snap-x snap-mandatory">
          {days.map((d) => {
            const sel = isoDate(d) === isoDate(date);
            const isToday = isoDate(d) === isoDate(today);
            const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dm = d.getDate();
            return (
              <button
                key={isoDate(d)}
                type="button"
                onClick={() => onDate(d)}
                className={cn(
                  'snap-start shrink-0 w-[58px] sm:w-[64px] py-3 rounded-xl border text-center transition',
                  sel
                    ? 'bg-ink text-primary-fg border-ink'
                    : 'bg-surface border-ink/10 hover:border-ink/40 text-ink',
                )}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">
                  {isToday ? 'Today' : dow}
                </div>
                <div className="font-display text-xl mt-1 leading-none tabular-nums">{dm}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={openPicker}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition"
      >
        <Calendar className="h-3.5 w-3.5" /> Pick a specific date
      </button>

      <input
        ref={inputRef}
        type="date"
        className="sr-only"
        value={isoDate(date)}
        min={isoDate(today)}
        max={isoDate(max)}
        onChange={(e) => {
          if (!e.target.value) return;
          const [y, m, d] = e.target.value.split('-').map(Number);
          onDate(new Date(y, m - 1, d));
        }}
      />
    </div>
  );
}

function StylistChip({
  name,
  sub,
  photo,
  active,
  onClick,
}: {
  name: string;
  sub?: string;
  photo?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border pl-1 pr-3.5 py-1 flex items-center gap-2 transition',
        active ? 'border-accent bg-accent/[0.06]' : 'border-ink/15 hover:border-ink/40',
      )}
    >
      {photo ? (
        <img src={photo} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-ink/8 text-ink grid place-items-center">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="text-left">
        <div className="text-xs font-medium leading-tight">{name}</div>
        {sub && <div className="text-[10px] text-muted leading-tight">{sub}</div>}
      </div>
    </button>
  );
}

function SlotPicker({
  slots,
  loading,
  time,
  onTime,
}: {
  slots: Slot[] | null;
  loading: boolean;
  time: string | null;
  onTime: (t: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 mb-2 shimmer-bg animate-shimmer rounded" />
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-10 rounded-lg shimmer-bg animate-shimmer" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-10 sm:py-14 border border-dashed border-ink/15 rounded-xl">
        <Calendar className="h-6 w-6 mx-auto mb-3 text-muted opacity-60" />
        <p className="text-sm text-muted">We're closed on this day.</p>
        <p className="text-xs text-muted mt-1">Please pick another date above.</p>
      </div>
    );
  }

  const groups: { label: string; icon: typeof Sun; items: Slot[] }[] = [
    { label: 'Morning', icon: Sunrise, items: [] },
    { label: 'Afternoon', icon: Sun, items: [] },
    { label: 'Evening', icon: Sunset, items: [] },
  ];
  for (const s of slots) {
    const h = parseInt(s.time.slice(0, 2), 10);
    const i = h < 12 ? 0 : h < 17 ? 1 : 2;
    groups[i].items.push(s);
  }

  return (
    <div className="space-y-5">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => {
          const Icon = g.icon;
          const availableCount = g.items.filter((s) => s.available).length;
          return (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted font-semibold">
                  <Icon className="h-3.5 w-3.5 text-accent" /> {g.label}
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  {availableCount} open
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {g.items.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => onTime(s.time)}
                    className={cn(
                      'rounded-lg h-10 px-1 text-xs font-medium tabular-nums transition border',
                      !s.available
                        ? 'border-ink/8 text-muted/40 line-through bg-surface cursor-not-allowed'
                        : time === s.time
                        ? 'border-ink bg-ink text-primary-fg shadow-soft'
                        : 'border-ink/12 bg-surface text-ink hover:border-ink/45',
                    )}
                  >
                    {fmtTime12(s.time)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ----------------------------------------------------------------- Step 3

function DetailsStep({
  register,
  errors,
  onSubmit,
  submitting,
  services,
  date,
  time,
  stylist,
  stylistsEnabled,
  totalDuration,
  totalPrice,
}: {
  register: ReturnType<typeof useForm<CustomerForm>>['register'];
  errors: FieldErrors;
  onSubmit: () => void;
  submitting: boolean;
  services: Service[];
  date: Date;
  time: string | null;
  stylist: Stylist | null;
  stylistsEnabled: boolean;
  totalDuration: number;
  totalPrice: number;
}) {
  return (
    <form
      id="booking-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-muted text-sm sm:text-base mt-1 leading-relaxed max-w-[52ch]">
        Just a few details and you're booked. We'll text confirmation to your phone.
      </p>

      {/* Inline review */}
      <div className="mt-6 rounded-xl border border-ink/12 bg-surface p-4 sm:p-5 space-y-3 text-sm">
        <Row icon={Scissors}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="leading-snug">{services.map((s) => s.name).join(' + ')}</span>
            <span className="font-display text-lg tabular-nums shrink-0">{inr(totalPrice)}</span>
          </div>
        </Row>
        <Row icon={Calendar}>
          <span>
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {time && (
              <>
                {' '}·{' '}
                <span className="text-ink font-medium tabular-nums">{fmtTime12(time)}</span>
              </>
            )}
            {totalDuration > 0 && <span className="text-muted"> · {totalDuration} min</span>}
          </span>
        </Row>
        {stylistsEnabled && (
          <Row icon={User}>
            <span>{stylist ? stylist.name : 'Any available stylist'}</span>
          </Row>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input
            className="input"
            autoComplete="name"
            {...register('customer_name')}
            placeholder="e.g. Anaya Sharma"
          />
          {errors.customer_name && (
            <p className="text-[11px] text-red-600 mt-1">{errors.customer_name.message}</p>
          )}
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input tabular-nums"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register('phone')}
            placeholder="+91 ..."
          />
          {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label">
            Email <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            {...register('email')}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">
            Notes <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            className="textarea"
            rows={3}
            {...register('notes')}
            placeholder="Allergies, hair inspiration, anything we should know"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="sr-only">
        Submit
      </button>
    </form>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-accent mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ----------------------------------------------------------------- Action bar (mobile)

function ActionBar({
  step,
  servicesCount,
  totalDuration,
  totalPrice,
  time,
  canContinue,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  step: 1 | 2 | 3;
  servicesCount: number;
  totalDuration: number;
  totalPrice: number;
  time: string | null;
  canContinue: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const summary =
    step === 1
      ? servicesCount > 0
        ? `${servicesCount} ${servicesCount === 1 ? 'service' : 'services'} · ${totalDuration} min`
        : 'Choose at least one service'
      : step === 2
      ? time
        ? `${fmtTime12(time)} · ${totalDuration} min`
        : 'Pick a time'
      : `${servicesCount} ${servicesCount === 1 ? 'service' : 'services'} · ${totalDuration} min`;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden border-t border-ink/[0.08] bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80 shadow-[0_-2px_14px_-8px_rgb(0_0_0/0.18)] pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Booking progress"
    >
      <div className="px-4 py-3 flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted truncate leading-tight">
            {summary}
          </div>
          {totalPrice > 0 && (
            <div className="font-display text-lg leading-tight tabular-nums">{inr(totalPrice)}</div>
          )}
        </div>
        {step > 1 && (
          <button
            onClick={onBack}
            className="h-11 w-11 grid place-items-center rounded-full border border-ink/15 text-ink hover:border-ink transition"
            type="button"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="btn-primary"
            type="button"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary"
            type="button"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Booking…
              </>
            ) : (
              <>
                Confirm <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Desktop summary

function DesktopSummary({
  step,
  services,
  stylist,
  stylistsEnabled,
  date,
  time,
  totalDuration,
  totalPrice,
  canContinue,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  step: 1 | 2 | 3;
  services: Service[];
  stylist: Stylist | null;
  stylistsEnabled: boolean;
  date: Date;
  time: string | null;
  totalDuration: number;
  totalPrice: number;
  canContinue: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <aside className="hidden lg:block sticky top-28">
      <div className="border border-ink/12 rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow-ink">Your booking</p>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Order summary</span>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          <div>
            <div className="eyebrow-ink mb-2">Services</div>
            {services.length === 0 ? (
              <div className="text-muted text-sm">None selected</div>
            ) : (
              <ul className="space-y-2">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-baseline justify-between gap-3 border-b border-dotted border-ink/15 pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate">{s.name}</div>
                      <div className="text-[11px] text-muted tracking-wide">{s.duration_min} min</div>
                    </div>
                    <span className="font-display tabular-nums shrink-0">{inr(s.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {stylistsEnabled && (
            <div>
              <div className="eyebrow-ink mb-1.5">Stylist</div>
              <div className={stylist ? '' : 'text-muted'}>
                {stylist ? stylist.name : 'Any available'}
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow-ink mb-1.5">When</div>
            <div className={time ? '' : 'text-muted'}>
              {time
                ? `${date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })} · ${fmtTime12(time)}`
                : 'Not selected'}
            </div>
            {totalDuration > 0 && (
              <div className="text-xs text-muted mt-0.5 tracking-wide">{totalDuration} min total</div>
            )}
          </div>
        </div>

        {services.length > 0 && (
          <div className="border-t border-ink/12 mt-6 pt-4 flex items-baseline justify-between">
            <span className="eyebrow-ink">Total</span>
            <span className="font-display text-3xl tabular-nums">{inr(totalPrice)}</span>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <button onClick={onBack} type="button" className="btn-outline flex-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={onNext}
              disabled={!canContinue}
              type="button"
              className="btn-primary flex-[1.4]"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              type="button"
              className="btn-primary flex-[1.4]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                </>
              ) : (
                <>
                  Confirm <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-[11px] text-muted mt-4 leading-relaxed">
          You won't be charged. We'll text to confirm.
        </p>
      </div>
    </aside>
  );
}

// ----------------------------------------------------------------- Confirmation

function ConfirmationView({
  booking,
  services,
  stylist,
  stylistsEnabled,
  totalDuration,
  totalPrice,
}: {
  booking: Booking;
  services: Service[];
  stylist: Stylist | null;
  stylistsEnabled: boolean;
  totalDuration: number;
  totalPrice: number;
}) {
  return (
    <div className="animate-fade-in">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent/15 text-accent grid place-items-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="eyebrow mt-6">Confirmed</p>
        <h2 className="h-display mt-3">
          You're <span className="italic text-accent">booked in</span>.
        </h2>
        <p className="text-muted mt-3 max-w-md mx-auto">
          A confirmation will be sent to{' '}
          <span className="text-ink font-medium">{booking.phone}</span>. See you soon.
        </p>
      </div>

      {/* Receipt-like card */}
      <div className="mt-10 sm:mt-12 rounded-2xl border border-ink/12 bg-surface p-6 sm:p-8 max-w-md mx-auto shadow-soft">
        <div className="flex items-baseline justify-between border-b border-dashed border-ink/15 pb-4 mb-4">
          <div>
            <div className="eyebrow-ink">Booking</div>
            <div className="font-display text-xl mt-1 tabular-nums">
              {booking.id.slice(0, 6).toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="eyebrow-ink">Total</div>
            <div className="font-display text-2xl mt-1 tabular-nums">{inr(totalPrice)}</div>
          </div>
        </div>

        <ul className="space-y-3.5 text-sm">
          <SummaryRow
            icon={Scissors}
            title={services.map((s) => s.name).join(' + ')}
            sub={`${totalDuration} min`}
          />
          <SummaryRow
            icon={Calendar}
            title={new Date(booking.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            sub={fmtTime12(booking.time)}
          />
          {stylistsEnabled && (
            <SummaryRow
              icon={User}
              title={stylist ? stylist.name : 'Any available stylist'}
              sub={stylist?.role}
            />
          )}
          <SummaryRow icon={Phone} title={booking.customer_name} sub={booking.phone} />
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-outline">
          Back to home
        </Link>
        <a href={`tel:${site.contact.phone}`} className="btn-primary">
          <Phone className="h-4 w-4" /> Call salon
        </a>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Calendar;
  title: string;
  sub?: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="h-9 w-9 rounded-full bg-accent/12 text-accent grid place-items-center shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {sub && <div className="text-xs text-muted truncate tabular-nums">{sub}</div>}
      </div>
    </li>
  );
}
