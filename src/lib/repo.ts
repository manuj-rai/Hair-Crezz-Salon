/**
 * Data access layer. If Supabase is configured, hits the real DB.
 * Otherwise falls back to in-memory demo data so the marketing site & booking
 * flow still work end-to-end for client demos / Vercel preview links.
 */
import { isSupabaseConfigured, supabase } from './supabase';
import {
  seedGallery,
  seedServices,
  seedStylists,
  seedTestimonials,
} from './seed';
import type {
  BlockedSlot,
  Booking,
  BookingStatus,
  BusinessHour,
  GalleryImage,
  Service,
  Stylist,
  Testimonial,
} from '../types/db';
import { site } from '../config/site';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- in-memory stores (only used in demo mode) ----------------------------
const memServices = [...seedServices];
const memStylists = [...seedStylists];
const memGallery = [...seedGallery];
const memTestimonials = [...seedTestimonials];
const memBookings: Booking[] = [];
const memBlocked: BlockedSlot[] = [];
const memHours: BusinessHour[] = site.hours.map((h, i) => ({
  day_of_week: ((i + 1) % 7), // mon=1..sun=0
  open_time: h.open,
  close_time: h.close,
  closed: false,
}));

const uid = () => Math.random().toString(36).slice(2, 11);

// --- public API -----------------------------------------------------------

export const repo = {
  mode: isSupabaseConfigured ? ('supabase' as const) : ('demo' as const),

  // ---- services ----
  async listServices(activeOnly = true): Promise<Service[]> {
    if (!supabase) return memServices.filter((s) => !activeOnly || s.active).sort((a, b) => a.sort_order - b.sort_order);
    const q = supabase.from('services').select('*').order('sort_order');
    const { data, error } = activeOnly ? await q.eq('active', true) : await q;
    if (error) throw error;
    return (data ?? []) as Service[];
  },
  async upsertService(s: Partial<Service> & { name: string; price: number; duration_min: number; category: string }): Promise<Service> {
    if (!supabase) {
      const idx = memServices.findIndex((x) => x.id === s.id);
      const next: Service = {
        id: s.id ?? uid(),
        name: s.name,
        category: s.category,
        description: s.description ?? null,
        duration_min: s.duration_min,
        price: s.price,
        active: s.active ?? true,
        sort_order: s.sort_order ?? memServices.length + 1,
      };
      if (idx >= 0) memServices[idx] = next; else memServices.push(next);
      return next;
    }
    const { data, error } = await supabase.from('services').upsert(s).select().single();
    if (error) throw error;
    return data as Service;
  },
  async deleteService(id: string) {
    if (!supabase) {
      const i = memServices.findIndex((x) => x.id === id);
      if (i >= 0) memServices.splice(i, 1);
      return;
    }
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- stylists ----
  async listStylists(activeOnly = true): Promise<Stylist[]> {
    if (!supabase) return memStylists.filter((s) => !activeOnly || s.active).sort((a, b) => a.sort_order - b.sort_order);
    const q = supabase.from('stylists').select('*').order('sort_order');
    const { data, error } = activeOnly ? await q.eq('active', true) : await q;
    if (error) throw error;
    return (data ?? []) as Stylist[];
  },
  async upsertStylist(s: Partial<Stylist> & { name: string; role: string }): Promise<Stylist> {
    if (!supabase) {
      const idx = memStylists.findIndex((x) => x.id === s.id);
      const next: Stylist = {
        id: s.id ?? uid(),
        name: s.name,
        role: s.role,
        bio: s.bio ?? null,
        photo_url: s.photo_url ?? null,
        specialties: s.specialties ?? [],
        active: s.active ?? true,
        sort_order: s.sort_order ?? memStylists.length + 1,
      };
      if (idx >= 0) memStylists[idx] = next; else memStylists.push(next);
      return next;
    }
    const { data, error } = await supabase.from('stylists').upsert(s).select().single();
    if (error) throw error;
    return data as Stylist;
  },
  async deleteStylist(id: string) {
    if (!supabase) {
      const i = memStylists.findIndex((x) => x.id === id);
      if (i >= 0) memStylists.splice(i, 1);
      return;
    }
    const { error } = await supabase.from('stylists').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- bookings ----
  async createBooking(input: Omit<Booking, 'id' | 'status' | 'created_at'>): Promise<Booking> {
    if (!supabase) {
      await sleep(400); // give the loading state a beat for realism
      const b: Booking = {
        ...input,
        id: uid(),
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      memBookings.unshift(b);
      return b;
    }
    const { data, error } = await supabase.from('bookings').insert({ ...input, status: 'pending' }).select().single();
    if (error) throw error;
    return data as Booking;
  },
  async listBookings(filter?: { status?: BookingStatus; date?: string }): Promise<Booking[]> {
    if (!supabase) {
      return memBookings.filter((b) =>
        (!filter?.status || b.status === filter.status) &&
        (!filter?.date || b.date === filter.date),
      );
    }
    let q = supabase.from('bookings').select('*').order('date', { ascending: false }).order('time');
    if (filter?.status) q = q.eq('status', filter.status);
    if (filter?.date) q = q.eq('date', filter.date);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Booking[];
  },
  async updateBookingStatus(id: string, status: BookingStatus) {
    if (!supabase) {
      const b = memBookings.find((x) => x.id === id);
      if (b) b.status = status;
      return;
    }
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async listBookedTimes(date: string, stylistId: string | null): Promise<{ time: string; duration_min: number }[]> {
    if (!supabase) {
      return memBookings
        .filter(
          (b) =>
            b.date === date &&
            b.status !== 'cancelled' &&
            (stylistId == null || b.stylist_id === stylistId),
        )
        .map((b) => ({ time: b.time, duration_min: b.duration_min }));
    }
    let q = supabase.from('bookings').select('time, duration_min').eq('date', date).neq('status', 'cancelled');
    if (stylistId) q = q.eq('stylist_id', stylistId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as { time: string; duration_min: number }[];
  },

  // ---- gallery ----
  async listGallery(): Promise<GalleryImage[]> {
    if (!supabase) return [...memGallery].sort((a, b) => a.sort_order - b.sort_order);
    const { data, error } = await supabase.from('gallery_images').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as GalleryImage[];
  },

  // ---- testimonials ----
  async listTestimonials(): Promise<Testimonial[]> {
    if (!supabase) return [...memTestimonials];
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Testimonial[];
  },

  // ---- hours / blocked ----
  async listHours(): Promise<BusinessHour[]> {
    if (!supabase) return [...memHours];
    const { data, error } = await supabase.from('business_hours').select('*').order('day_of_week');
    if (error) throw error;
    return (data ?? []) as BusinessHour[];
  },
  async listBlocked(date: string): Promise<BlockedSlot[]> {
    if (!supabase) return memBlocked.filter((b) => b.date === date);
    const { data, error } = await supabase.from('blocked_slots').select('*').eq('date', date);
    if (error) throw error;
    return (data ?? []) as BlockedSlot[];
  },
};
