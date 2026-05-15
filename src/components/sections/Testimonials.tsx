import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import type { Testimonial } from '../../types/db';
import { repo } from '../../lib/repo';

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    repo.listTestimonials().then(setItems).catch(() => setItems([]));
  }, []);

  const featured = items?.[0];
  const rest = items?.slice(1) ?? [];

  return (
    <section id="reviews" className="section bg-surface relative overflow-hidden">
      <div
        className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ background: 'rgb(var(--c-accent))' }}
      />

      <div className="container-x relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start mb-12 lg:mb-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">In their words</p>
            <h2 className="h-display mt-4">
              Loved by our <span className="italic text-accent">regulars</span>.
            </h2>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-muted">4.9 average · 500+ Google reviews</span>
            </div>
          </div>

          {/* Featured quote — oversized pull quote */}
          {!items ? (
            <div className="lg:col-span-7 h-44 sm:h-56 shimmer-bg animate-shimmer rounded-[2px]" />
          ) : featured ? (
            <figure className="lg:col-span-7 relative">
              <span
                aria-hidden
                className="absolute -top-8 -left-2 sm:-top-12 sm:-left-4 font-display text-[140px] sm:text-[200px] leading-none text-accent/15 select-none"
              >
                "
              </span>
              <blockquote className="relative font-display text-2xl sm:text-3xl lg:text-[34px] leading-snug tracking-tight text-ink">
                <span className="italic">{featured.body}</span>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <span className="h-10 w-10 rounded-full bg-accent/15 text-accent grid place-items-center font-display">
                  {featured.author.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold">{featured.author}</div>
                  {featured.source && (
                    <div className="text-xs text-muted tracking-wide uppercase">
                      via {featured.source}
                    </div>
                  )}
                </div>
                <div className="ml-auto hidden sm:flex text-accent">
                  {Array.from({ length: featured.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ) : null}
        </div>

        {/* Supporting reviews — marquee on mobile, grid on desktop */}
        {!items ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 shimmer-bg animate-shimmer rounded-[2px]" />
            ))}
          </div>
        ) : rest.length === 0 ? null : (
          <>
            <div className="hidden lg:grid grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.slice(0, 3).map((t) => (
                <ReviewCard key={t.id} t={t} />
              ))}
            </div>
            <div className="lg:hidden -mx-5 sm:-mx-6 fade-x overflow-hidden marquee-pause">
              <div className="marquee-track flex gap-4" style={{ animationDuration: '40s' }}>
                {[...rest, ...rest].map((t, i) => (
                  <div key={`${t.id}-${i}`} className="w-[260px] sm:w-[300px] shrink-0">
                    <ReviewCard t={t} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ t }: { t: Testimonial }) {
  return (
    <article className="h-full border-t border-ink/15 pt-5 flex flex-col">
      <div className="flex text-accent mb-3">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <p className="text-[14.5px] leading-relaxed text-ink/85 flex-1 line-clamp-5">
        {t.body}
      </p>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-semibold">{t.author}</span>
        {t.source && (
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted">{t.source}</span>
        )}
      </div>
    </article>
  );
}
