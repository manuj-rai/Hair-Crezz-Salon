import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import type { Testimonial } from '../../types/db';
import { repo } from '../../lib/repo';

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    repo.listTestimonials().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <section id="reviews" className="section bg-surface">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow">Kind words</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3">Loved by our regulars.</h2>
        </div>

        {!items ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 h-44 shimmer-bg animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((t) => (
              <article key={t.id} className="card p-6 flex flex-col">
                <Quote className="h-6 w-6 text-accent" />
                <p className="text-sm leading-relaxed mt-3 flex-1">{t.body}</p>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    {t.source && <div className="text-xs text-muted">via {t.source}</div>}
                  </div>
                  <div className="flex text-accent">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
