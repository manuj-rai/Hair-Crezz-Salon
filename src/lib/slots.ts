import { addMinutes } from './utils';
import type { BlockedSlot, BusinessHour } from '../types/db';
import { site } from '../config/site';

export type Slot = { time: string; available: boolean };

/** Convert HH:mm to minutes since midnight. */
const m = (t: string) => {
  const [h, mm] = t.split(':').map(Number);
  return h * 60 + mm;
};

/**
 * Generate 30-minute slots for a date based on business hours, then mark
 * unavailable any slot whose [start, start+duration) overlaps an existing
 * booking, blocked range, or falls before now+leadTime.
 */
export function generateSlots(args: {
  date: Date;
  hour: BusinessHour | undefined;
  durationMin: number;
  bookings: { time: string; duration_min: number }[];
  blocked: BlockedSlot[];
  now?: Date;
}): Slot[] {
  const { date, hour, durationMin, bookings, blocked } = args;
  if (!hour || hour.closed || !hour.open_time || !hour.close_time) return [];

  const open = m(hour.open_time);
  const close = m(hour.close_time);
  const step = site.booking.slotMinutes;

  const now = args.now ?? new Date();
  const isToday = date.toDateString() === now.toDateString();
  const minTimeIfToday = isToday ? now.getHours() * 60 + now.getMinutes() + site.booking.leadTimeHours * 60 : -Infinity;

  const slots: Slot[] = [];
  for (let t = open; t + durationMin <= close; t += step) {
    const time = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    const slotEnd = t + durationMin;

    const overlapsBooking = bookings.some((b) => {
      const bs = m(b.time);
      const be = bs + b.duration_min;
      return t < be && slotEnd > bs;
    });
    const overlapsBlocked = blocked.some((b) => {
      const bs = m(b.start_time);
      const be = m(b.end_time);
      return t < be && slotEnd > bs;
    });
    const tooSoon = t < minTimeIfToday;

    slots.push({ time, available: !overlapsBooking && !overlapsBlocked && !tooSoon });
  }

  return slots;
}

export function endTimeFor(start: string, duration: number) {
  return addMinutes(start, duration);
}
