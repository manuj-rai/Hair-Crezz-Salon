import { useEffect, useMemo, useState } from 'react';
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
import { cn, fmtTime12, inr, isoDate, nextDays } from '../lib/utils';
import { generateSlots, type Slot } from '../lib/slots';
import { site } from '../config/site';

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Service', 'Date & time', 'Your details'] as const;

const customerSchema = z.object({
  customer_name: z.string().min(2, 'Please enter your full name'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;
type FieldErrors = Partial<Record<keyof CustomerForm, { message?: string }>>;

export default function BookingPage() {
  const [params] = useSearchParams();
  const presetService = params.get('service');
  const presetStylist = params.get('stylist');
  const stylistsEnabled = site.sections.stylists;

  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(presetService);
  const [stylistId, setStylistId] = useState<string>(stylistsEnabled ? presetStylist ?? 'any' : 'any');
  const [date, setDate] = useState<Date>(new Date());
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
        if (presetService && !s.find((x) => x.id === presetService)) setServiceId(null);
      })
      .catch(() => toast.error('Could not load services'));
  }, [presetService, stylistsEnabled]);

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const stylist = useMemo(
    () => (stylistId === 'any' ? null : stylists.find((s) => s.id === stylistId) ?? null),
    [stylists, stylistId],
  );
  const days = useMemo(() => nextDays(site.booking.advanceWindowDays), []);

  useEffect(() => {
    if (step !== 2 || !service) return;
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
        setSlots(generateSlots({ date, hour, durationMin: service.duration_min, bookings: booked, blocked }));
      })
      .catch(() => toast.error('Could not load availability'))
      .finally(() => setLoadingSlots(false));
  }, [step, date, service, stylist]);

  const form = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  async function submit(values: CustomerForm) {
    if (!service || !time) return;
    setSubmitting(true);
    try {
      const booking = await repo.createBooking({
        customer_name: values.customer_name,
        phone: values.phone,
        email: values.email || null,
        service_id: service.id,
        stylist_id: stylist?.id ?? null,
        date: isoDate(date),
        time,
        duration_min: service.duration_min,
        price: service.price,
        notes: values.notes || null,
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

  if (step === 4 && confirmed && service) {
    return (
      <div className="min-h-full pb-24 lg:pb-0">
        <Header />
        <main className="container-x py-8 sm:py-16 max-w-xl">
          <ConfirmationView booking={confirmed} service={service} stylist={stylist} stylistsEnabled={stylistsEnabled} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 lg:pb-0">
      <Header />

      <main className="container-x py-5 sm:py-10 lg:py-16 max-w-5xl">
        <Link to="/" className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-6">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 lg:gap-8 items-start">
          <div>
            <Stepper step={step as 1 | 2 | 3} />

            <div key={step} className="card p-4 sm:p-8 mt-4 sm:mt-6 animate-fade-in">
              {step === 1 && (
                <ServiceStep
                  services={services}
                  selected={serviceId}
                  onSelect={setServiceId}
                  onNext={() => serviceId && setStep(2)}
                />
              )}
              {step === 2 && (
                <WhenStep
                  days={days}
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
                  onBack={() => setStep(1)}
                  onNext={() => time && setStep(3)}
                />
              )}
              {step === 3 && (
                <DetailsStep
                  register={form.register}
                  errors={form.formState.errors}
                  onBack={() => setStep(2)}
                  onSubmit={form.handleSubmit(submit)}
                  submitting={submitting}
                />
              )}
            </div>
          </div>

          <Summary service={service} stylist={stylist} date={date} time={time} stylistsEnabled={stylistsEnabled} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ----------------------------------------------------------------- Stepper

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const current = step - 1;
  const progress = ((current + 1) / STEPS.length) * 100;
  return (
    <div>
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted">
            Step {current + 1} of {STEPS.length}
          </span>
          <span className="text-ink">{STEPS[current]}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="hidden sm:flex items-center text-xs">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <li key={label} className="flex items-center gap-3 flex-1 last:flex-none">
              <div
                className={cn(
                  'h-8 w-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 transition-colors',
                  done ? 'bg-accent text-accent-fg' : active ? 'bg-primary text-primary-fg' : 'bg-surface border border-border text-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('font-medium whitespace-nowrap', active || done ? 'text-ink' : 'text-muted')}>{label}</span>
              {i < STEPS.length - 1 && <div className={cn('h-px flex-1 mx-1', done ? 'bg-accent' : 'bg-border')} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ----------------------------------------------------------------- Step 1

function ServiceStep({
  services,
  selected,
  onSelect,
  onNext,
}: {
  services: Service[];
  selected: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const cats = Array.from(new Set(services.map((s) => s.category)));
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl mb-1">What can we do for you?</h2>
      <p className="text-muted text-sm mb-5 sm:mb-6">Choose a service to get started.</p>

      <div className="space-y-5">
        {cats.map((c) => (
          <div key={c}>
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">{c}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {services
                .filter((s) => s.category === c)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={cn(
                      'text-left rounded-xl border p-3 sm:p-4 transition-all',
                      selected === s.id ? 'border-accent bg-accent/5 shadow-soft' : 'border-border hover:border-ink',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium leading-snug">{s.name}</div>
                        <div className="text-xs text-muted mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {s.duration_min} min
                        </div>
                      </div>
                      <div className="font-semibold text-sm shrink-0">{inr(s.price)}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={onNext} disabled={!selected} className="btn-primary w-full sm:w-auto">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Step 2

function WhenStep({
  days,
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
  onBack,
  onNext,
}: {
  days: Date[];
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
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl mb-1">When works for you?</h2>
      <p className="text-muted text-sm mb-5 sm:mb-6">Pick a day, then a time.</p>

      {stylistsEnabled && stylists.length > 0 && (
        <div className="mb-5 sm:mb-6">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Preferred stylist</div>
          <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-1">
            <StylistChip name="Any" sub="First available" active={stylistId === 'any'} onClick={() => onStylist('any')} />
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

      <DateStrip days={days} date={date} onDate={onDate} />

      <SlotPicker slots={slots} loading={loading} time={time} onTime={onTime} />

      <div className="grid grid-cols-2 gap-2 mt-6 sm:mt-8">
        <button onClick={onBack} className="btn-outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext} disabled={!time} className="btn-primary">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
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
        'shrink-0 rounded-xl border px-3 py-2 flex items-center gap-2 transition',
        active ? 'border-accent bg-accent/5' : 'border-border hover:border-ink',
      )}
    >
      {photo ? (
        <img src={photo} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center">
          <User className="h-4 w-4" />
        </div>
      )}
      <div className="text-left">
        <div className="text-sm font-medium leading-tight">{name}</div>
        {sub && <div className="text-[11px] text-muted leading-tight">{sub}</div>}
      </div>
    </button>
  );
}

function DateStrip({ days, date, onDate }: { days: Date[]; date: Date; onDate: (d: Date) => void }) {
  const today = new Date();
  const todayIso = isoDate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = isoDate(tomorrow);
  return (
    <div className="grid grid-flow-col auto-cols-[4.25rem] gap-2 overflow-x-auto -mx-2 px-2 pb-2 mb-5 sm:mb-6">
      {days.map((d) => {
        const iso = isoDate(d);
        const sel = iso === isoDate(date);
        const label =
          iso === todayIso ? 'Today' : iso === tomorrowIso ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onDate(d)}
            className={cn(
              'rounded-xl border min-h-[76px] py-2.5 text-center transition-colors',
              sel ? 'bg-primary text-primary-fg border-primary' : 'bg-surface border-border hover:border-ink',
            )}
          >
            <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
            <div className="text-lg font-semibold leading-none mt-1">{d.getDate()}</div>
            <div className="text-[10px] opacity-80 mt-1">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
          </button>
        );
      })}
    </div>
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
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl shimmer-bg animate-shimmer" />
        ))}
      </div>
    );
  }
  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-10 text-muted">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">We're closed on this day. Please pick another date.</p>
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
    <div className="space-y-4">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.label}>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted font-semibold mb-2">
                <Icon className="h-3.5 w-3.5" /> {g.label}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {g.items.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => onTime(s.time)}
                    className={cn(
                      'rounded-xl min-h-12 px-2 py-3 text-sm font-medium border transition',
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
  onBack,
  onSubmit,
  submitting,
}: {
  register: ReturnType<typeof useForm<CustomerForm>>['register'];
  errors: FieldErrors;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="font-display text-2xl sm:text-3xl mb-1">Almost there.</h2>
      <p className="text-muted text-sm mb-5 sm:mb-6">We'll send a confirmation to your phone.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input className="input" autoComplete="name" {...register('customer_name')} placeholder="e.g. Anaya Sharma" />
          {errors.customer_name && <p className="text-xs text-red-600 mt-1">{errors.customer_name.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} placeholder="+91 ..." />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label">
            Email <span className="text-muted font-normal">(optional)</span>
          </label>
          <input className="input" type="email" autoComplete="email" {...register('email')} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">
            Notes <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea className="textarea" rows={3} {...register('notes')} placeholder="Allergies, inspiration, anything we should know" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-6 sm:mt-8">
        <button type="button" onClick={onBack} className="btn-outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Booking…
            </>
          ) : (
            <>
              Confirm booking <Check className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------- Confirmation

function ConfirmationView({
  booking,
  service,
  stylist,
  stylistsEnabled,
}: {
  booking: Booking;
  service: Service;
  stylist: Stylist | null;
  stylistsEnabled: boolean;
}) {
  return (
    <div className="text-center animate-fade-in">
      <div className="mx-auto h-16 w-16 rounded-full bg-accent/15 text-accent grid place-items-center">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="font-display text-3xl sm:text-4xl mt-5">You're booked in.</h2>
      <p className="text-muted mt-2">
        A confirmation will be sent to <span className="font-medium text-ink">{booking.phone}</span>.
      </p>

      <div className="card p-5 mt-8 text-left max-w-sm mx-auto space-y-4">
        <SummaryRow icon={Scissors} title={service.name} sub={`${service.duration_min} min · ${inr(service.price)}`} />
        {stylistsEnabled && (
          <SummaryRow icon={User} title={stylist ? stylist.name : 'Any available stylist'} sub={stylist?.role} />
        )}
        <SummaryRow
          icon={Calendar}
          title={new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

function SummaryRow({ icon: Icon, title, sub }: { icon: typeof Calendar; title: string; sub?: string }) {
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

// ----------------------------------------------------------------- Summary

function Summary({
  service,
  stylist,
  date,
  time,
  stylistsEnabled,
}: {
  service: Service | null;
  stylist: Stylist | null;
  date: Date;
  time: string | null;
  stylistsEnabled: boolean;
}) {
  return (
    <aside className="hidden lg:block card p-6 sticky top-24">
      <h3 className="font-display text-xl mb-4">Your booking</h3>

      <ul className="space-y-4 text-sm">
        <li>
          <div className="text-xs uppercase tracking-wider text-muted">Service</div>
          <div className="mt-0.5">{service?.name ?? <span className="text-muted">Not selected</span>}</div>
          {service && <div className="text-xs text-muted">{service.duration_min} min</div>}
        </li>
        {stylistsEnabled && (
          <li>
            <div className="text-xs uppercase tracking-wider text-muted">Stylist</div>
            <div className="mt-0.5">{stylist?.name ?? <span className="text-muted">Any available</span>}</div>
          </li>
        )}
        <li>
          <div className="text-xs uppercase tracking-wider text-muted">When</div>
          <div className="mt-0.5">
            {time ? (
              <>
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {fmtTime12(time)}
              </>
            ) : (
              <span className="text-muted">Not selected</span>
            )}
          </div>
        </li>
      </ul>

      {service && (
        <div className="border-t border-border mt-5 pt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Total</span>
          <span className="font-semibold text-lg">{inr(service.price)}</span>
        </div>
      )}
    </aside>
  );
}
