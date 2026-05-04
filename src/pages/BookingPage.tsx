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
  User,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { repo } from '../lib/repo';
import type { Booking, Service, Stylist } from '../types/db';
import { fmtTime12, inr, isoDate, nextDays } from '../lib/utils';
import { generateSlots, type Slot } from '../lib/slots';
import { site } from '../config/site';
import { cn } from '../lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

const customerSchema = z.object({
  customer_name: z.string().min(2, 'Please enter your full name'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export default function BookingPage() {
  const [params] = useSearchParams();
  const presetService = params.get('service');
  const presetStylist = params.get('stylist');

  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(presetService);
  const [stylistId, setStylistId] = useState<string | null>(presetStylist ?? 'any');
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
    Promise.all([repo.listServices(), repo.listStylists()])
      .then(([s, st]) => {
        setServices(s);
        setStylists(st);
        if (presetService && !s.find((x) => x.id === presetService)) setServiceId(null);
      })
      .catch(() => toast.error('Could not load services'));
  }, [presetService]);

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const stylist = useMemo(
    () => (stylistId === 'any' || !stylistId ? null : stylists.find((s) => s.id === stylistId) ?? null),
    [stylists, stylistId],
  );
  const dayDate = nextDays(site.booking.advanceWindowDays);

  // Load slots when date / service / stylist change
  useEffect(() => {
    if (step !== 3 || !service) return;
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
      setStep(5);
    } catch (e) {
      console.error(e);
      toast.error('Could not create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full">
      <Header />

      <main className="container-x py-12 lg:py-16 max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-6">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <Stepper step={step} />

            <div className="card p-6 sm:p-8 mt-6">
              {step === 1 && (
                <Step1Service
                  services={services}
                  selected={serviceId}
                  onSelect={(id) => setServiceId(id)}
                  onNext={() => serviceId && setStep(2)}
                />
              )}
              {step === 2 && (
                <Step2Stylist
                  stylists={stylists}
                  selected={stylistId}
                  onSelect={setStylistId}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <Step3DateTime
                  days={dayDate}
                  date={date}
                  onDate={setDate}
                  slots={slots}
                  loading={loadingSlots}
                  time={time}
                  onTime={setTime}
                  onBack={() => setStep(2)}
                  onNext={() => time && setStep(4)}
                />
              )}
              {step === 4 && (
                <Step4Customer
                  register={form.register}
                  errors={form.formState.errors}
                  onBack={() => setStep(3)}
                  onSubmit={form.handleSubmit(submit)}
                  submitting={submitting}
                />
              )}
              {step === 5 && confirmed && service && (
                <Step5Done booking={confirmed} service={service} stylist={stylist} />
              )}
            </div>
          </div>

          <Summary service={service} stylist={stylist} date={date} time={time} step={step} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ----------------------------------------------------------------- subviews

function Stepper({ step }: { step: Step }) {
  const labels = ['Service', 'Stylist', 'Date & time', 'Your details', 'Confirmed'];
  return (
    <ol className="flex items-center gap-2 sm:gap-4 text-xs">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <li key={l} className="flex items-center gap-2 sm:gap-4 flex-1 last:flex-none">
            <div
              className={cn(
                'h-7 w-7 rounded-full grid place-items-center text-xs font-semibold shrink-0',
                done ? 'bg-accent text-accent-fg' : active ? 'bg-primary text-primary-fg' : 'bg-surface border border-border text-muted',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span className={cn('hidden sm:inline font-medium', active ? 'text-ink' : done ? 'text-ink' : 'text-muted')}>{l}</span>
            {i < labels.length - 1 && <div className={cn('h-px flex-1', done ? 'bg-accent' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}

function Step1Service({
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
      <h2 className="font-display text-2xl sm:text-3xl mb-1">Choose a service</h2>
      <p className="text-muted text-sm mb-6">Pick the treatment you'd like to book.</p>

      <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 -mr-2">
        {cats.map((c) => (
          <div key={c}>
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">{c}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {services.filter((s) => s.category === c).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    'text-left rounded-xl border p-4 transition',
                    selected === s.id ? 'border-accent bg-accent/5 shadow-soft' : 'border-border hover:border-ink',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="font-semibold text-sm shrink-0">{inr(s.price)}</div>
                  </div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {s.duration_min} min
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={onNext} disabled={!selected} className="btn-primary">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Step2Stylist({
  stylists,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  stylists: Stylist[];
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl mb-1">Pick a stylist</h2>
      <p className="text-muted text-sm mb-6">Or let us assign the best available artist for you.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onSelect('any')}
          className={cn(
            'rounded-xl border p-4 text-left transition flex items-center gap-3',
            selected === 'any' ? 'border-accent bg-accent/5' : 'border-border hover:border-ink',
          )}
        >
          <div className="h-12 w-12 rounded-full bg-primary text-primary-fg grid place-items-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">Any stylist</div>
            <div className="text-xs text-muted">First available</div>
          </div>
        </button>
        {stylists.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'rounded-xl border p-4 text-left transition flex items-center gap-3',
              selected === s.id ? 'border-accent bg-accent/5' : 'border-border hover:border-ink',
            )}
          >
            {s.photo_url ? (
              <img src={s.photo_url} alt={s.name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-surface grid place-items-center font-display">
                {s.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted">{s.role}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="btn-outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext} className="btn-primary">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Step3DateTime({
  days,
  date,
  onDate,
  slots,
  loading,
  time,
  onTime,
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
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl mb-1">Pick a date & time</h2>
      <p className="text-muted text-sm mb-6">Available slots update in real time.</p>

      <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-2 mb-6">
        {days.map((d) => {
          const isSel = isoDate(d) === isoDate(date);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDate(d)}
              className={cn(
                'shrink-0 rounded-xl border w-16 py-3 text-center transition',
                isSel ? 'bg-primary text-primary-fg border-primary' : 'bg-surface border-border hover:border-ink',
              )}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-80">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold">{d.getDate()}</div>
              <div className="text-[10px] opacity-80">
                {d.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg shimmer-bg animate-shimmer" />
          ))}
        </div>
      ) : !slots || slots.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>We're closed on this day. Please pick another date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {slots.map((s) => (
            <button
              key={s.time}
              type="button"
              disabled={!s.available}
              onClick={() => onTime(s.time)}
              className={cn(
                'rounded-lg py-2.5 text-sm font-medium border transition',
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
      )}

      <div className="flex justify-between mt-8">
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

type FieldErrors = Partial<Record<keyof CustomerForm, { message?: string }>>;

function Step4Customer({
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <h2 className="font-display text-2xl sm:text-3xl mb-1">Your details</h2>
      <p className="text-muted text-sm mb-6">We'll text you a reminder the day before.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input className="input" {...register('customer_name')} placeholder="e.g. Anaya Sharma" />
          {errors.customer_name && <p className="text-xs text-red-600 mt-1">{errors.customer_name.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register('phone')} placeholder="+91 ..." />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label">Email <span className="text-muted font-normal">(optional)</span></label>
          <input className="input" type="email" {...register('email')} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes for stylist <span className="text-muted font-normal">(optional)</span></label>
          <textarea className="textarea" rows={3} {...register('notes')} placeholder="Allergies, inspiration, etc." />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className="btn-outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <>Confirm booking <Check className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}

function Step5Done({ booking, service, stylist }: { booking: Booking; service: Service; stylist: Stylist | null }) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto h-16 w-16 rounded-full bg-accent/15 text-accent grid place-items-center">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="font-display text-3xl mt-5">You're booked in.</h2>
      <p className="text-muted mt-2">A confirmation will be sent to <span className="font-medium text-ink">{booking.phone}</span>.</p>

      <div className="card p-5 mt-8 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Scissors className="h-5 w-5 text-accent" />
          <div>
            <div className="font-medium">{service.name}</div>
            <div className="text-xs text-muted">{service.duration_min} min · {inr(service.price)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-accent" />
          <div className="text-sm">{stylist ? stylist.name : 'Any available stylist'}</div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-accent" />
          <div className="text-sm">
            {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {fmtTime12(booking.time)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-accent" />
          <div className="text-sm">{booking.customer_name}</div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-outline">Back to home</Link>
        <a href={`tel:${site.contact.phone}`} className="btn-ghost"><Phone className="h-4 w-4" /> Call salon</a>
      </div>
    </div>
  );
}

function Summary({
  service, stylist, date, time, step,
}: {
  service: Service | null;
  stylist: Stylist | null;
  date: Date;
  time: string | null;
  step: Step;
}) {
  if (step === 5) return null;
  return (
    <aside className="card p-6 sticky top-24">
      <h3 className="font-display text-xl mb-4">Your booking</h3>

      <ul className="space-y-4 text-sm">
        <li>
          <div className="text-xs uppercase tracking-wider text-muted">Service</div>
          <div className="mt-0.5">{service?.name ?? <span className="text-muted">Not selected</span>}</div>
          {service && <div className="text-xs text-muted">{service.duration_min} min · {inr(service.price)}</div>}
        </li>
        <li>
          <div className="text-xs uppercase tracking-wider text-muted">Stylist</div>
          <div className="mt-0.5">{stylist?.name ?? <span className="text-muted">Any available</span>}</div>
        </li>
        <li>
          <div className="text-xs uppercase tracking-wider text-muted">When</div>
          <div className="mt-0.5">
            {time ? (
              <>
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {fmtTime12(time)}
              </>
            ) : <span className="text-muted">Not selected</span>}
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
