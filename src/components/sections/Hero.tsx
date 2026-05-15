import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { site } from '../../config/site';

const TRUST_STRIP = [
  'Senior stylists',
  'Wella · Olaplex · L\'Oréal Pro',
  'Hygiene-first',
  '4.9 ★ on Google',
  'Free first consultation',
];

export default function Hero() {
  const words = site.tagline.split(' ');
  const last = words.pop() ?? '';
  const lead = words.join(' ');

  return (
    <section className="relative">
      {/* Editorial split. Mobile: stacked. Desktop: 6+6 with image bleeding right. */}
      <div className="container-x pt-4 pb-6 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Copy column */}
          <div className="lg:col-span-7 animate-fade-in">
            <div className="flex items-center gap-3 mb-5 sm:mb-7">
              <span className="h-px w-8 bg-accent" />
              <span className="eyebrow">Pune · Est. since you walked in</span>
            </div>

            <h1 className="h-display-xl">
              {lead}{' '}
              <span className="italic font-display text-accent">{last}.</span>
            </h1>

            <p className="mt-5 sm:mt-7 text-[15px] sm:text-lg text-muted max-w-[42ch] leading-relaxed">
              {site.description}
            </p>

            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link to="/book" className="btn-primary btn-lg flex-1 sm:flex-none min-w-[180px]">
                Book an appointment <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#services" className="btn-outline btn-lg flex-1 sm:flex-none min-w-[150px]">
                View the menu
              </a>
            </div>

            {/* Trust row — visible on mobile, replaces hidden floaters */}
            <div className="mt-7 sm:mt-9 flex items-center gap-5 sm:gap-7">
              <div className="flex -space-x-2">
                {[14, 33, 47, 26].map((i) => (
                  <span
                    key={i}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-bg shimmer-bg bg-cover bg-center"
                    style={{ backgroundImage: `url(https://i.pravatar.cc/80?img=${i})` }}
                  />
                ))}
              </div>
              <div>
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] sm:text-xs text-muted mt-1 tracking-wide">
                  4.9 / 5 · 500+ reviews · Google
                </p>
              </div>
            </div>
          </div>

          {/* Image column — editorial portrait. Mobile: full bleed-ish, slight overlap on desktop. */}
          <div className="lg:col-span-5 relative animate-slide-up">
            <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] overflow-hidden rounded-[2px] shadow-soft grain">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=85"
                alt="Inside the salon"
                className="absolute inset-0 h-full w-full object-cover kenburns"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />

              {/* Issue / date tag — magazine cover flourish */}
              <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2 text-primary-fg/90">
                <span className="text-[10px] uppercase tracking-[0.3em]">Vol. 01</span>
                <span className="h-px w-6 bg-primary-fg/50" />
                <span className="text-[10px] uppercase tracking-[0.3em]">The Chair</span>
              </div>

              {/* Today's slots — visible above the fold to communicate availability */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5">
                <div className="rounded-xl bg-bg/95 backdrop-blur px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted font-semibold">
                      Today's openings
                    </span>
                    <Link
                      to="/book"
                      className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-accent font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Book <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['11:00', '12:30', '15:00', '17:00', '18:30'].map((t) => (
                      <Link
                        key={t}
                        to="/book"
                        className="text-[11px] sm:text-xs font-medium tracking-wide rounded-full border border-ink/15 bg-surface px-2.5 py-1 hover:border-accent hover:text-accent transition"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee trust strip */}
      <div className="border-y border-ink/10 bg-bg/60 overflow-hidden marquee-pause">
        <div className="marquee-track flex items-center gap-10 py-3.5 sm:py-4 text-[11px] sm:text-xs uppercase tracking-[0.28em] text-muted">
          {[...TRUST_STRIP, ...TRUST_STRIP, ...TRUST_STRIP].map((t, i) => (
            <span key={i} className="flex items-center gap-10 shrink-0">
              <span>{t}</span>
              <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
