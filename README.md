# Hair Crezz Salon — Salon Website + Booking + Admin

A production-ready, **multi-client reskinnable** salon template:

- **Landing page** — hero, services & pricing, stylists, gallery, testimonials, hours, map, contact
- **Booking flow** — service → stylist → date → time → details → confirmation
- **Admin dashboard** — bookings, services, stylists, business hours
- **Free-tier stack** — Vite + React + TypeScript + Tailwind + Supabase, deploys to Vercel/Netlify free

The repo runs in **demo mode** out-of-the-box (no Supabase needed) using seed data and an in-memory booking store — perfect for client previews. Plug in Supabase env vars to switch to a real database with zero code changes.

---

## Quick start (local)

```bash
npm install
npm run dev      # http://localhost:5173
```

Demo admin login: `admin@demo.local` / `admin`

---

## Reskinning for a new client

Everything you'll typically swap lives in two places:

### 1. Brand identity → `src/config/site.ts`

Salon name, tagline, phone, email, address, hours, social links, Google Map embed URL.

### 2. Visual theme → `src/config/theme.ts` (or `.env.local`)

Colors are RGB triplets (space-separated, no `rgb()`). They flow into Tailwind via CSS variables, so `bg-primary`, `text-accent`, etc. all just work.

```env
# .env.local — override per-client without touching code
VITE_THEME_PRIMARY=24 24 27
VITE_THEME_ACCENT=184 134 71
VITE_THEME_BG=250 248 246
VITE_GOOGLE_FONT_HREF=https://fonts.googleapis.com/css2?family=...
```

### 3. Operational data → Supabase (managed by the salon at `/admin`)

Services, stylists, gallery and testimonials are stored in Supabase, so the salon can edit them through the admin panel without redeploying.

---

## Going live with Supabase (free tier)

1. **Create a project** at [supabase.com](https://supabase.com) → New project (free tier).
2. **Run the schema** — open *SQL Editor → New query*, paste `supabase/schema.sql`, *Run*. Optionally also run `supabase/seed.sql` for starter services & stylists.
3. **Create an admin user** — *Authentication → Users → Add user*, set an email + password.
4. **Copy your keys** — *Project Settings → API*. Set them in `.env.local`:
    ```env
    VITE_SUPABASE_URL=https://xxxx.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGc...
    ```
5. Restart `npm run dev` — the admin badge in the sidebar should now read "Connected to Supabase".

Row-level security is configured so:
- Anonymous visitors can **read** services/stylists/gallery/hours and **insert** bookings.
- Only authenticated admins can read bookings or modify any catalog data.

---

## Deploying free (Vercel)

```bash
npm run build           # outputs to /dist
```

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → *New Project* → import the repo. Framework: **Vite**.
3. Add env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy. SPA routing is handled by `vercel.json`.

For Netlify, the same `dist` output works; SPA fallback is in `public/_redirects`.

---

## Project structure

```
src/
├── config/         # site.ts, theme.ts, nav.ts — swap per client
├── lib/            # supabase, repo (data layer), auth, slot generation, utils, seed
├── types/          # domain types (Service, Stylist, Booking, ...)
├── components/     # Header, Footer, sections/, BrandIcons
├── pages/
│   ├── LandingPage.tsx
│   ├── BookingPage.tsx
│   └── admin/      # AdminLayout, RequireAuth, login, dashboard, bookings, services, stylists, hours
├── App.tsx         # routes
├── main.tsx
└── index.css       # Tailwind + design-token CSS variables
supabase/
├── schema.sql      # tables + RLS policies (idempotent)
└── seed.sql        # optional starter services/stylists/etc.
```

---

## Customisation cheatsheet

| Want to change…                     | Edit                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| Salon name, tagline, contact, hours | `src/config/site.ts`                                        |
| Brand colors / fonts                | `src/config/theme.ts` (or `VITE_THEME_*` env vars)          |
| Header navigation links             | `src/config/nav.ts`                                         |
| Default seed services / stylists    | `src/lib/seed.ts` (demo mode) and `supabase/seed.sql` (prod)|
| "Why us" pillars                    | `src/components/sections/WhyUs.tsx`                         |
| SEO meta tags                       | `index.html`                                                |

---

## Stack

| Layer       | Tool                                    | Free tier |
| ----------- | --------------------------------------- | --------- |
| UI          | React 19 + TypeScript                   | ✅        |
| Bundler     | Vite                                    | ✅        |
| Styling     | Tailwind CSS v3 + CSS variables         | ✅        |
| Forms       | react-hook-form + zod                   | ✅        |
| Routing     | react-router-dom                        | ✅        |
| Toasts      | sonner                                  | ✅        |
| Icons       | lucide-react + custom brand SVG         | ✅        |
| Backend/DB  | Supabase (Postgres + Auth + RLS)        | ✅        |
| Hosting     | Vercel / Netlify                        | ✅        |

Total monthly cost at low/medium traffic: **₹0**.
