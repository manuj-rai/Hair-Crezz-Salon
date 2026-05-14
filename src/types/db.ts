/** Domain types — shared by Supabase repo + the in-memory demo repo. */

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_min: number;
  price: number;
  active: boolean;
  sort_order: number;
};

export type ServiceCategory = {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
};

export type Stylist = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  active: boolean;
  sort_order: number;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  service_id: string;
  stylist_id?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration_min: number;
  price: number;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
};

export type Testimonial = {
  id: string;
  author: string;
  rating: number;
  body: string;
  source: string | null;
  created_at: string;
};

export type BusinessHour = {
  day_of_week: number; // 0=Sun..6=Sat
  open_time: string | null; // HH:mm
  close_time: string | null;
  closed: boolean;
};

export type BlockedSlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};
