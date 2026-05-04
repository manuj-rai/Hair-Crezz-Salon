import type { Service, ServiceCategory, Stylist, GalleryImage, Testimonial } from '../types/db';

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
