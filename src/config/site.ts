/**
 * Site identity. Swap these values to reskin the template for a new client.
 * Anything that is "operational data" (services, stylists, gallery) lives in Supabase
 * so the salon can edit it from /admin without a redeploy.
 */
export const site = {
  name: 'Hair Crezz Salon',
  shortName: 'Hair Crezz',
  tagline: 'Where Style Meets Sophistication',
  description:
    'A premium unisex salon delivering precision cuts, expert color and bridal styling in a relaxed, modern space.',

  sections: {
    hero: true,
    whyUs: true,
    services: true,
    stylists: false,
    gallery: true,
    reviews: true,
    cta: true,
    contact: true,
  },

  contact: {
    phone: '+91 87999 33509',
    whatsapp: '+918799933509',
    email: 'manuj.services@gmail.com',
    address: {
      line1: 'Hair Crezz Salon',
      line2: 'Pune, Maharashtra',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    },
  },

  hours: [
    { day: 'Mon', open: '10:00', close: '20:00' },
    { day: 'Tue', open: '10:00', close: '20:00' },
    { day: 'Wed', open: '10:00', close: '20:00' },
    { day: 'Thu', open: '10:00', close: '20:00' },
    { day: 'Fri', open: '10:00', close: '21:00' },
    { day: 'Sat', open: '09:00', close: '21:00' },
    { day: 'Sun', open: '10:00', close: '19:00' },
  ],

  social: {
    instagram: 'https://www.instagram.com/hair.crezz/',
    facebook: 'https://www.facebook.com/hair.crezz/',
    google: 'https://share.google/AgYCuKWRkHQ9QBC7q',
  },

  // Embed map: replace with your Google "Embed a map" iframe src
  mapEmbed:
    'https://www.google.com/maps?q=Hair+Crezz+Salon+Pune&output=embed',

  // Booking constraints
  booking: {
    slotMinutes: 30,
    leadTimeHours: 2,
    advanceWindowDays: 30,
  },

  seo: {
    titleSuffix: '— Premium Unisex Salon',
    keywords: ['salon', 'haircut', 'hair color', 'bridal makeup', 'spa'],
  },
} as const;

export type SiteConfig = typeof site;
