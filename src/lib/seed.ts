import type { Booking, Service, ServiceCategory, Stylist, GalleryImage, Testimonial } from '../types/db';
import { composeBookingNotes } from './booking';

/** Demo seed data — used in demo mode AND as starter rows for the SQL seed. */

export const seedServiceCategories: ServiceCategory[] = [
  { id: 'c1', name: 'Hair', active: true, sort_order: 1 },
  { id: 'c2', name: 'Spa', active: true, sort_order: 2 },
  { id: 'c3', name: 'Skin', active: true, sort_order: 3 },
  { id: 'c4', name: 'Bridal', active: true, sort_order: 4 },
  { id: 'c5', name: 'Nails', active: true, sort_order: 5 },
  { id: 'c6', name: 'Waxing', active: true, sort_order: 6 },
];

export const seedServices: Service[] = [
  { id: 's1', category: 'Hair', name: "Women's Haircut & Styling", description: 'Consultation, wash, precision cut and blow-dry finish.', duration_min: 60, price: 1200, active: true, sort_order: 1 },
  { id: 's2', category: 'Hair', name: "Men's Haircut", description: 'Classic or modern cuts tailored to your face shape.', duration_min: 45, price: 600, active: true, sort_order: 2 },
  { id: 's3', category: 'Hair', name: 'Global Hair Color', description: 'Single-tone color in your choice of brand and shade.', duration_min: 120, price: 3500, active: true, sort_order: 3 },
  { id: 's4', category: 'Hair', name: 'Highlights & Balayage', description: 'Hand-painted highlights for a sun-kissed, dimensional look.', duration_min: 180, price: 5500, active: true, sort_order: 4 },
  { id: 's5', category: 'Hair', name: 'Keratin / Smoothening', description: 'Frizz-free, glossy, manageable hair for up to 6 months.', duration_min: 180, price: 6500, active: true, sort_order: 5 },
  { id: 's6', category: 'Spa', name: 'Hair Spa & Treatment', description: 'Deep-conditioning ritual with scalp massage.', duration_min: 60, price: 1500, active: true, sort_order: 6 },
  { id: 's7', category: 'Skin', name: 'Signature Facial', description: 'Cleanse, exfoliate, mask and massage with premium products.', duration_min: 75, price: 2200, active: true, sort_order: 7 },
  { id: 's8', category: 'Skin', name: 'Clean-Up', description: 'Quick refresh: cleanse, scrub, steam and pack.', duration_min: 45, price: 900, active: true, sort_order: 8 },
  { id: 's9', category: 'Bridal', name: 'Bridal Makeup Trial', description: 'Trial session to lock in your wedding-day look.', duration_min: 90, price: 4500, active: true, sort_order: 9 },
  { id: 's10', category: 'Bridal', name: 'Bridal Makeup & Hair', description: 'HD makeup, hairstyling and draping for your big day.', duration_min: 180, price: 18000, active: true, sort_order: 10 },
  { id: 's11', category: 'Nails', name: 'Gel Manicure', description: 'Long-wear gel polish with cuticle care.', duration_min: 60, price: 1200, active: true, sort_order: 11 },
  { id: 's12', category: 'Waxing', name: 'Full-Body Waxing', description: 'Roll-on wax with after-care.', duration_min: 90, price: 2500, active: true, sort_order: 12 },
];

export const seedStylists: Stylist[] = [
  { id: 'st1', name: 'Aarav Mehta', role: 'Creative Director', bio: '12+ years, trained in London. Specialises in precision cutting and balayage.', photo_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80', specialties: ['Cuts', 'Color', 'Balayage'], active: true, sort_order: 1 },
  { id: 'st2', name: 'Priya Shah', role: 'Senior Stylist', bio: 'Bridal specialist with a love for soft, romantic looks and HD makeup.', photo_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80', specialties: ['Bridal', 'Makeup', 'Updos'], active: true, sort_order: 2 },
  { id: 'st3', name: 'Rohan Patel', role: 'Senior Barber', bio: "Men's grooming expert — fades, beards and classic scissor cuts.", photo_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80', specialties: ["Men's Cuts", 'Beards', 'Fades'], active: true, sort_order: 3 },
  { id: 'st4', name: 'Sneha Iyer', role: 'Color & Spa Therapist', bio: 'Color correction and rejuvenating hair-spa rituals.', photo_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&q=80', specialties: ['Color', 'Spa', 'Treatments'], active: true, sort_order: 4 },
];

export const seedGallery: GalleryImage[] = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80', caption: 'Salon interior', sort_order: 1 },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80', caption: 'Color station', sort_order: 2 },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80', caption: 'Bridal styling', sort_order: 3 },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80', caption: 'Gent\'s grooming', sort_order: 4 },
  { id: 'g5', url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80', caption: 'Cut & finish', sort_order: 5 },
  { id: 'g6', url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80', caption: 'Updo', sort_order: 6 },
  { id: 'g7', url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=900&q=80', caption: 'Highlights', sort_order: 7 },
  { id: 'g8', url: 'https://images.unsplash.com/photo-1607008829749-c0f284a49841?w=900&q=80', caption: 'Spa', sort_order: 8 },
];

export const seedTestimonials: Testimonial[] = [
  { id: 't1', author: 'Ananya R.', rating: 5, body: 'Best balayage I have ever had — Aarav understood exactly the dimension I wanted. The salon is gorgeous and so calming.', source: 'Google', created_at: '2025-09-12' },
  { id: 't2', author: 'Karan D.', rating: 5, body: "Rohan's fades are unmatched. I drive across the city every month for my cut.", source: 'Instagram', created_at: '2025-10-02' },
  { id: 't3', author: 'Meera J.', rating: 5, body: 'Priya did my bridal hair and makeup — every single guest asked who my artist was. Worth every rupee.', source: 'Google', created_at: '2025-11-21' },
  { id: 't4', author: 'Diya K.', rating: 5, body: 'The hair spa is pure bliss. I leave feeling like a new person every time.', source: 'Google', created_at: '2025-12-08' },
];

// ---------------------------------------------------------------- demo bookings

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offsetDate(now: Date, days: number): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return isoDay(d);
}

type Spec = {
  customer_name: string;
  phone: string;
  email?: string | null;
  service_ids: string[];
  stylist_id?: string | null;
  dayOffset: number;
  time: string;
  status: Booking['status'];
  notes?: string;
};

const specs: Spec[] = [
  // ----- past (mostly completed / a couple cancelled) -----
  { customer_name: 'Riya Kapoor',     phone: '+91 98765 11001', email: 'riya.kapoor@example.com',
    service_ids: ['s1'],          stylist_id: 'st1', dayOffset: -12, time: '11:00', status: 'completed' },
  { customer_name: 'Vikram Joshi',    phone: '+91 98765 11002',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: -10, time: '17:00', status: 'completed' },
  { customer_name: 'Aarti Desai',     phone: '+91 98765 11003', email: 'aarti.d@example.com',
    service_ids: ['s7', 's11'],   stylist_id: 'st4', dayOffset: -9,  time: '14:00', status: 'completed',
    notes: 'Allergic to fragrance' },
  { customer_name: 'Manish Gupta',    phone: '+91 98765 11004',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: -7,  time: '10:30', status: 'completed' },
  { customer_name: 'Sneha Bhatt',     phone: '+91 98765 11005',
    service_ids: ['s3'],          stylist_id: 'st1', dayOffset: -6,  time: '11:00', status: 'completed' },
  { customer_name: 'Pooja Nair',      phone: '+91 98765 11006',
    service_ids: ['s6', 's8'],    stylist_id: 'st4', dayOffset: -5,  time: '12:30', status: 'cancelled' },
  { customer_name: 'Tanvi Sharma',    phone: '+91 98765 11007', email: 'tanvi.s@example.com',
    service_ids: ['s4'],          stylist_id: 'st1', dayOffset: -4,  time: '13:00', status: 'completed' },
  { customer_name: 'Aakash Patel',    phone: '+91 98765 11008',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: -3,  time: '18:00', status: 'completed' },
  { customer_name: 'Neha Singh',      phone: '+91 98765 11009',
    service_ids: ['s5'],          stylist_id: 'st1', dayOffset: -3,  time: '14:30', status: 'completed' },
  { customer_name: 'Karthik Iyer',    phone: '+91 98765 11010',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: -2,  time: '16:00', status: 'no_show' },
  { customer_name: 'Bhavna Jain',     phone: '+91 98765 11011',
    service_ids: ['s1', 's6'],    stylist_id: 'st1', dayOffset: -1,  time: '10:00', status: 'completed',
    notes: 'Birthday treat for mom' },
  { customer_name: 'Rakesh Mehta',    phone: '+91 98765 11012',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: -1,  time: '12:00', status: 'completed' },

  // ----- today (mix) -----
  { customer_name: 'Aisha Khan',      phone: '+91 98765 11013', email: 'aisha.k@example.com',
    service_ids: ['s1', 's11'],   stylist_id: 'st1', dayOffset: 0,   time: '10:30', status: 'completed' },
  { customer_name: 'Devansh Roy',     phone: '+91 98765 11014',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: 0,   time: '11:30', status: 'completed' },
  { customer_name: 'Ishita Verma',    phone: '+91 98765 11015',
    service_ids: ['s7'],          stylist_id: 'st4', dayOffset: 0,   time: '13:00', status: 'confirmed' },
  { customer_name: 'Rohan Mehra',     phone: '+91 98765 11016',
    service_ids: ['s4'],          stylist_id: 'st1', dayOffset: 0,   time: '15:00', status: 'confirmed' },
  { customer_name: 'Priyanka Joshi',  phone: '+91 98765 11017', email: 'priyanka.j@example.com',
    service_ids: ['s9'],          stylist_id: 'st2', dayOffset: 0,   time: '17:00', status: 'pending',
    notes: 'Wedding date 2 weeks out — please call to confirm' },
  { customer_name: 'Ankit Shah',      phone: '+91 98765 11018',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: 0,   time: '18:30', status: 'confirmed' },

  // ----- future -----
  { customer_name: 'Megha Arora',     phone: '+91 98765 11019',
    service_ids: ['s3', 's6'],    stylist_id: 'st4', dayOffset: 1,   time: '11:00', status: 'confirmed',
    notes: 'Wants warm honey brown' },
  { customer_name: 'Saurabh Pandey',  phone: '+91 98765 11020',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: 1,   time: '13:30', status: 'pending' },
  { customer_name: 'Kavita Reddy',    phone: '+91 98765 11021', email: 'kavita.r@example.com',
    service_ids: ['s10'],         stylist_id: 'st2', dayOffset: 2,   time: '11:00', status: 'confirmed',
    notes: 'Bridal — her own suite please' },
  { customer_name: 'Nisha Bansal',    phone: '+91 98765 11022',
    service_ids: ['s8'],          stylist_id: 'st4', dayOffset: 2,   time: '15:30', status: 'confirmed' },
  { customer_name: 'Harsh Vora',      phone: '+91 98765 11023',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: 3,   time: '18:00', status: 'pending' },
  { customer_name: 'Lavanya Pillai',  phone: '+91 98765 11024',
    service_ids: ['s1', 's7', 's11'], stylist_id: 'st1', dayOffset: 4, time: '12:00', status: 'confirmed',
    notes: 'Pamper-day combo' },
  { customer_name: 'Yash Trivedi',    phone: '+91 98765 11025',
    service_ids: ['s2'],          stylist_id: 'st3', dayOffset: 5,   time: '17:30', status: 'pending' },
  { customer_name: 'Reema Saxena',    phone: '+91 98765 11026',
    service_ids: ['s12'],         stylist_id: null,  dayOffset: 6,   time: '10:00', status: 'confirmed' },
  { customer_name: 'Anjali Bose',     phone: '+91 98765 11027', email: 'anjali.b@example.com',
    service_ids: ['s9'],          stylist_id: 'st2', dayOffset: 8,   time: '14:00', status: 'pending' },
  { customer_name: 'Shreya Kulkarni', phone: '+91 98765 11028',
    service_ids: ['s4', 's6'],    stylist_id: 'st1', dayOffset: 10,  time: '11:30', status: 'confirmed' },
];

export function generateSeedBookings(now: Date = new Date()): Booking[] {
  // Built relative to "now" so the demo always shows today/upcoming/past
  // bookings regardless of when the page is opened.
  const services = new Map(seedServices.map((s) => [s.id, s]));
  return specs.map((spec, i) => {
    const selected = spec.service_ids
      .map((id) => services.get(id))
      .filter((s): s is Service => Boolean(s));
    const duration_min = selected.reduce((sum, s) => sum + s.duration_min, 0);
    const price = selected.reduce((sum, s) => sum + s.price, 0);
    const date = offsetDate(now, spec.dayOffset);
    const created = new Date(now);
    created.setDate(created.getDate() + Math.min(spec.dayOffset, -1) - Math.floor(Math.random() * 3));
    return {
      id: `seed-b${i + 1}`,
      customer_name: spec.customer_name,
      phone: spec.phone,
      email: spec.email ?? null,
      service_id: selected[0]?.id ?? spec.service_ids[0],
      stylist_id: spec.stylist_id ?? null,
      date,
      time: spec.time,
      duration_min,
      price,
      notes: composeBookingNotes(selected.map((s) => s.name), spec.notes ?? ''),
      status: spec.status,
      created_at: created.toISOString(),
    };
  });
}
