import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Stylist } from '../../types/db';
import { repo } from '../../lib/repo';

export default function Stylists() {
  const [items, setItems] = useState<Stylist[] | null>(null);

  useEffect(() => {
    repo.listStylists().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <section id="stylists" className="section bg-surface">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow">Meet the artists</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3">Hands you can trust.</h2>
          <p className="text-muted mt-3 leading-relaxed">
            Award-winning stylists with decades of combined experience — and the gentlest chairs in town.
          </p>
        </div>

        {!items ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl shimmer-bg animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((s) => (
              <Link
                key={s.id}
                to={`/book?stylist=${s.id}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-bg">
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-4xl font-display text-muted">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-fg">
                    <h3 className="font-display text-xl">{s.name}</h3>
                    <p className="text-xs text-primary-fg/80">{s.role}</p>
                  </div>
                </div>
                {s.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.specialties.map((sp) => (
                      <span key={sp} className="badge bg-accent/10 text-ink">{sp}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
