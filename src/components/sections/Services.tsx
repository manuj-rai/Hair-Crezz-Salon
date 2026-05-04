import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { Service } from '../../types/db';
import { repo } from '../../lib/repo';
import { inr } from '../../lib/utils';

export default function Services() {
  const [items, setItems] = useState<Service[] | null>(null);
  const [active, setActive] = useState<string>('All');

  useEffect(() => {
    repo.listServices().then(setItems).catch(() => setItems([]));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    items?.forEach((s) => set.add(s.category));
    return [...set];
  }, [items]);

  const filtered = items?.filter((s) => active === 'All' || s.category === active) ?? [];

  return (
    <section id="services" className="section">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Services & Pricing</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3">A complete menu of beauty.</h2>
            <p className="text-muted mt-3 leading-relaxed">
              Transparent pricing, expert hands. Browse by category and book in seconds.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={
                  'btn-sm rounded-full px-4 py-2 text-xs font-medium border transition shrink-0 ' +
                  (active === c
                    ? 'bg-primary text-primary-fg border-primary'
                    : 'bg-transparent text-muted border-border hover:text-ink hover:border-ink')
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {!items ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6 h-40 shimmer-bg animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <article key={s.id} className="card p-6 group hover:shadow-glow transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="badge bg-accent/10 text-ink mb-2">{s.category}</span>
                    <h3 className="font-display text-xl">{s.name}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{inr(s.price)}</div>
                    <div className="text-xs text-muted flex items-center gap-1 justify-end mt-1">
                      <Clock className="h-3 w-3" /> {s.duration_min}m
                    </div>
                  </div>
                </div>
                {s.description && (
                  <p className="text-sm text-muted mt-3 leading-relaxed">{s.description}</p>
                )}
                <Link
                  to={`/book?service=${s.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-accent transition"
                >
                  Book this <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
