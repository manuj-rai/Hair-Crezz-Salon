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
  ChevronDown,
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
import { site } from '../config/site';

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Services', 'Date & time', 'Details'] as const;
export const SERVICES_NOTE_PREFIX = 'Services: ';

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
        stylist_id: stylist?.id ?? null,
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
      <div className="min-h-full pb-28 lg:pb-0">
        <Header />
        <main className="container-x py-8 sm:py-16 max-w-xl">
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
    <div className="min-h-full pb-28 lg:pb-0">
      <Header />

      <main className="container-x py-4 sm:py-8 lg:py-12 max-w-5xl">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:items-start">
          <div className="min-w-0">
            <Stepper step={step as 1 | 2 | 3} />

            <div key={step} className="card p-4 sm:p-6 mt-4 animate-fade-in">
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
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2 text-xs">
      {STEPS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex-1 last:flex-none flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'h-7 w-7 sm:h-8 sm:w-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 transition-colors',
                done
                  ? 'bg-accent text-accent-fg'
                  : active
                  ? 'bg-primary text-primary-fg'
                  : 'bg-surface border border-border text-muted',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'font-medium truncate hidden sm:inline',
                active || done ? 'text-ink' : 'text-muted',
              )}
            >
              {label}
            </span>
            <span className={cn('font-medium truncate sm:hidden', active ? 'text-ink' : 'hidden')}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px flex-1 mx-0.5 sm:mx-1', done ? 'bg-accent' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
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
  const [openCat, setOpenCat] = useState<string | null>(null);

  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl">What can we do for you?</h2>
      <p className="text-muted text-xs sm:text-sm mt-1">Pick one or more — we'll add up the time and price.</p>

      <div className="mt-4 space-y-1.5">
        {cats.map((c) => {
          const items = services.filter((s) => s.category === c);
          const selectedHere = items.filter((s) => selected.includes(s.id)).length;
          const open = openCat === c;
          return (
            <div key={c} className="rounded-xl border border-border overflow-hidden bg-surface">
              <button
                type="button"
                onClick={() => setOpenCat(open ? null : c)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 text-left hover:bg-bg/50 transition"
              >
                <div className="flex items-center gap-2 min-w-0 text-sm">
                  <span className="font-medium truncate">{c}</span>
                  <span className="text-xs text-muted shrink-0">({items.length})</span>
                  {selectedHere > 0 && (
                    <span className="badge bg-accent/15 text-accent shrink-0">{selectedHere}</span>
                  )}
                </div>
                <ChevronDown
                  className={cn('h-4 w-4 text-muted transition-transform shrink-0', open && 'rotate-180')}
                />
              </button>
              {open && (
                <ul className="border-t border-border divide-y divide-border sm:divide-y-0 sm:p-2 sm:grid sm:grid-cols-2 sm:gap-1.5">
                  {items.map((s) => {
                    const sel = selected.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => onToggle(s.id)}
                          className={cn(
                            'w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition sm:rounded-lg sm:border sm:px-2.5 sm:py-2',
                            sel
                              ? 'bg-accent/5 sm:border-accent'
                              : 'sm:border-border hover:bg-bg/60 sm:hover:border-ink',
                          )}
                        >
                          <span
                            className={cn(
                              'h-[18px] w-[18px] rounded-md border grid place-items-center shrink-0 transition',
                              sel ? 'bg-accent border-accent text-accent-fg' : 'border-border',
                            )}
                          >
                            {sel && <Check className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium leading-snug truncate">{s.name}</span>
                              <span className="text-sm font-semibold shrink-0">{inr(s.price)}</span>
                            </span>
                            <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {s.duration_min} min
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 rounded-lg bg-bg border border-border px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-muted text-xs sm:text-sm">
            {selected.length} {selected.length === 1 ? 'service' : 'services'} · {totalDuration} min
          </span>
          <span className="font-semibold">{inr(totalPrice)}</span>
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
      <h2 className="font-display text-xl sm:text-2xl">When works for you?</h2>
      <p className="text-muted text-xs sm:text-sm mt-1">Choose a day and a time that suits.</p>

      {stylistsEnabled && stylists.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1.5">
            Preferred stylist
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
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
      )}

      <div className="mt-3">
        <DatePicker date={date} onDate={onDate} />
      </div>

      <div className="mt-3">
        <SlotPicker slots={slots} loading={loading} time={time} onTime={onTime} />
      </div>
    </div>
  );
}

function DatePicker({ date, onDate }: { date: Date; onDate: (d: Date) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = startOfDay(new Date());
  const max = new Date(today);
  max.setDate(max.getDate() + site.booking.advanceWindowDays - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const quick = [
    { label: 'Today', d: today },
    { label: 'Tomorrow', d: tomorrow },
    {
      label: nextOfWeekday(today, 6).toLocaleDateString('en-US', { weekday: 'short' }),
      d: nextOfWeekday(today, 6),
    },
    {
      label: nextOfWeekday(today, 0).toLocaleDateString('en-US', { weekday: 'short' }),
      d: nextOfWeekday(today, 0),
    },
  ];

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
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 hover:border-ink transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-accent shrink-0" />
          <span className="font-medium text-sm truncate">
            {date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted" />
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

      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {quick.map((q) => {
          const sel = isoDate(q.d) === isoDate(date);
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onDate(q.d)}
              className={cn(
                'rounded-md border py-1 text-[11px] font-medium leading-tight transition',
                sel
                  ? 'bg-primary text-primary-fg border-primary'
                  : 'bg-surface border-border text-muted hover:text-ink hover:border-ink',
              )}
            >
              <div>{q.label}</div>
              <div className="text-[10px] opacity-70 font-normal">
                {q.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function nextOfWeekday(from: Date, dow: number) {
  const d = new Date(from);
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
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
        'shrink-0 rounded-lg border px-2 py-1.5 flex items-center gap-2 transition',
        active ? 'border-accent bg-accent/5' : 'border-border hover:border-ink',
      )}
    >
      {photo ? (
        <img src={photo} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center">
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
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-9 rounded-md shimmer-bg animate-shimmer" />
        ))}
      </div>
    );
  }
  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-6 text-muted">
        <Calendar className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
        <p className="text-xs">We're closed on this day. Please pick another date.</p>
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
    <div className="space-y-2">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.label}>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
                <Icon className="h-3 w-3" /> {g.label}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
                {g.items.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => onTime(s.time)}
                    className={cn(
                      'rounded-md h-9 px-1 text-xs font-medium border transition',
                      !s.available
                        ? 'border-border text-muted/50 line-through bg-surface/50 cursor-not-allowed'
                        : time === s.time
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border bg-surface hover:border-ink',
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
      <h2 className="font-display text-xl sm:text-2xl">Almost there.</h2>
      <p className="text-muted text-xs sm:text-sm mt-1">We'll send a confirmation to your phone.</p>

      <div className="rounded-lg bg-bg border border-border px-3 py-2 mt-3 text-xs sm:text-sm space-y-1">
        <div className="flex items-start gap-2">
          <Scissors className="h-3.5 w-3.5 text-muted mt-0.5 shrink-0" />
          <span className="flex-1 leading-snug">{services.map((s) => s.name).join(' + ')}</span>
          <span className="font-semibold">{inr(totalPrice)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {time && ` · ${fmtTime12(time)}`}
            {totalDuration > 0 && ` · ${totalDuration} min`}
          </span>
        </div>
        {stylistsEnabled && (
          <div className="flex items-center gap-2 text-muted">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>{stylist ? stylist.name : 'Any available stylist'}</span>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
        <div className="sm:col-span-2">
          <label className="label text-xs sm:text-sm mb-1">Full name</label>
          <input
            className="input text-sm py-2"
            autoComplete="name"
            {...register('customer_name')}
            placeholder="e.g. Anaya Sharma"
          />
          {errors.customer_name && (
            <p className="text-[11px] text-red-600 mt-0.5">{errors.customer_name.message}</p>
          )}
        </div>
        <div>
          <label className="label text-xs sm:text-sm mb-1">Phone</label>
          <input
            className="input text-sm py-2"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register('phone')}
            placeholder="+91 ..."
          />
          {errors.phone && <p className="text-[11px] text-red-600 mt-0.5">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label text-xs sm:text-sm mb-1">
            Email <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            className="input text-sm py-2"
            type="email"
            autoComplete="email"
            {...register('email')}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-[11px] text-red-600 mt-0.5">{errors.email.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label text-xs sm:text-sm mb-1">
            Notes <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            className="textarea text-sm py-2"
            rows={2}
            {...register('notes')}
            placeholder="Allergies, inspiration, anything we should know"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="sr-only">
        Submit
      </button>
    </form>
  );
}

// ----------------------------------------------------------------- Action bar

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
        : 'Pick at least one service'
      : step === 2
      ? time
        ? `${fmtTime12(time)} · ${totalDuration} min`
        : 'Pick a time'
      : `${servicesCount} ${servicesCount === 1 ? 'service' : 'services'} · ${totalDuration} min`;

  return (
    <div className="fixed inset-x-0 bottom-14 z-40 lg:hidden">
      <div className="border-t border-border bg-surface/95 backdrop-blur px-3 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted truncate leading-tight">{summary}</div>
          {totalPrice > 0 && (
            <div className="text-sm font-semibold leading-tight">{inr(totalPrice)}</div>
          )}
        </div>
        {step > 1 && (
          <button onClick={onBack} className="btn-outline btn-sm" type="button" aria-label="Back">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {step < 3 ? (
          <button onClick={onNext} disabled={!canContinue} className="btn-primary btn-sm" type="button">
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={onSubmit} disabled={submitting} className="btn-primary btn-sm" type="button">
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Booking…
              </>
            ) : (
              <>
                Confirm <Check className="h-3.5 w-3.5" />
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
    <aside className="hidden lg:block sticky top-24">
      <div className="card p-5">
        <h3 className="font-display text-lg">Your booking</h3>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">
              Services
            </div>
            {services.length === 0 ? (
              <div className="text-muted">Not selected</div>
            ) : (
              <ul className="space-y-1.5">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{s.name}</span>
                    <span className="text-muted shrink-0">{inr(s.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {stylistsEnabled && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
                Stylist
              </div>
              <div className={stylist ? '' : 'text-muted'}>
                {stylist ? stylist.name : 'Any available'}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              When
            </div>
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
              <div className="text-xs text-muted mt-0.5">{totalDuration} min total</div>
            )}
          </div>
        </div>

        {services.length > 0 && (
          <div className="border-t border-border mt-5 pt-4 flex items-center justify-between">
            <span className="text-sm text-muted">Total</span>
            <span className="font-semibold text-lg">{inr(totalPrice)}</span>
          </div>
        )}

        <div className="mt-5 flex gap-2">
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
              className="btn-primary flex-1"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              type="button"
              className="btn-primary flex-1"
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
    <div className="text-center animate-fade-in">
      <div className="mx-auto h-16 w-16 rounded-full bg-accent/15 text-accent grid place-items-center">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="font-display text-3xl sm:text-4xl mt-5">You're booked in.</h2>
      <p className="text-muted mt-2">
        A confirmation will be sent to{' '}
        <span className="font-medium text-ink">{booking.phone}</span>.
      </p>

      <div className="card p-5 mt-8 text-left max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{services.map((s) => s.name).join(' + ')}</div>
            <div className="text-xs text-muted">
              {totalDuration} min · {inr(totalPrice)}
            </div>
          </div>
        </div>
        {stylistsEnabled && (
          <SummaryRow
            icon={User}
            title={stylist ? stylist.name : 'Any available stylist'}
            sub={stylist?.role}
          />
        )}
        <SummaryRow
          icon={Calendar}
          title={new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
          sub={fmtTime12(booking.time)}
        />
        <SummaryRow icon={Phone} title={booking.customer_name} sub={booking.phone} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
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
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {sub && <div className="text-xs text-muted truncate">{sub}</div>}
      </div>
    </div>
  );
}
