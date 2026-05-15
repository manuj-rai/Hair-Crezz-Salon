import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Service, ServiceCategory } from '../../types/db';
import { repo } from '../../lib/repo';
import { cn, inr } from '../../lib/utils';

export default function Services() {
  const [items, setItems] = useState<Service[] | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [active, setActive] = useState<string>('All');

  useEffect(() => {
    Promise.all([repo.listServices(), repo.listServiceCategories()])
      .then(([services, serviceCategories]) => {
        setItems(services);
        setCategories(serviceCategories);
      })
      .catch(() => setItems([]));
  }, []);

  const tabs = useMemo(() => {
    if (categories.length > 0) return ['All', ...categories.map((c) => c.name)];
    const set = new Set<string>(['All']);
    items?.forEach((s) => set.add(s.category));
    return [...set];
  }, [categories, items]);

  const visibleCategoryNames = useMemo(() => new Set(categories.map((c) => c.name)), [categories]);
  const filtered = items?.filter((s) => {
    if (categories.length > 0 && !visibleCategoryNames.has(s.category)) return false;
    return active === 'All' || s.category === active;
  }) ?? [];

  // Group by category when "All" is active so it still reads like a menu.
  const groups = useMemo(() => {
    if (active !== 'All') return [{ name: active, items: filtered }];
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [active, filtered]);

  const total = items?.length ?? 0;

  return (
    <section id="services" className="section-tight bg-bg">
      <div className="container-x">
        {/* Compact header — single row on desktop, stacked on mobile */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="eyebrow">The menu</p>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] lg:text-[3rem] leading-[1.05] tracking-tight mt-2">
              Services &amp; <span className="italic text-accent">prices</span>.
            </h2>
          </div>
          {total > 0 && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted shrink-0">
              {total} services · tap to book
            </p>
          )}
        </div>

        {/* Sticky chip rail — keeps filters reachable while scrolling */}
        <div className="sticky top-14 sm:top-16 lg:top-20 z-20 -mx-5 sm:-mx-6 lg:mx-0 mb-6 sm:mb-8 bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
          <div className="fade-x lg:fade-none">
            <div className="flex gap-1.5 overflow-x-auto px-5 sm:px-6 lg:px-0 lg:overflow-visible no-scrollbar py-2">
              {tabs.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={cn(
                    'chip shrink-0 !py-1 !px-3 !text-[11px]',
                    active === c && 'chip-active',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="h-px bg-ink/[0.08] mx-5 sm:mx-6 lg:mx-0" />
        </div>

        {!items ? (
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, gi) => (
              <div key={gi}>
                <div className="h-3 w-32 shimmer-bg animate-shimmer rounded mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 shimmer-bg animate-shimmer rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            No services in this category yet.
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {groups.map((g) => (
              <div key={g.name}>
                {/* Compact group rule — single thin line with name + count */}
                <div className="flex items-baseline gap-3 mb-3 sm:mb-4">
                  <h3 className="text-[11px] uppercase tracking-[0.24em] font-semibold text-ink shrink-0">
                    {g.name}
                  </h3>
                  <span className="flex-1 h-px bg-ink/15" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted shrink-0 tabular-nums">
                    {String(g.items.length).padStart(2, '0')}
                  </span>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-8 gap-y-0">
                  {g.items.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/book?service=${s.id}`}
                        className="group relative flex items-baseline gap-2 py-2.5 border-b border-ink/[0.08] transition hover:border-accent"
                        aria-label={`Book ${s.name}`}
                      >
                        <span className="text-[14px] font-medium text-ink leading-snug truncate group-hover:text-accent transition">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-muted tabular-nums shrink-0 leading-snug">
                          · {s.duration_min}m
                        </span>

                        {/* Leader dots — kept thin on every viewport */}
                        <span className="flex-1 self-end mb-[6px] border-b border-dotted border-ink/15 min-w-[8px]" />

                        <span className="font-display text-[15px] tabular-nums shrink-0 text-ink leading-snug">
                          {inr(s.price)}
                        </span>
                        <ArrowUpRight className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 self-center" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-ink/[0.08]">
          <p className="text-xs text-muted max-w-md leading-relaxed">
            Pricing may vary with hair length and product. We confirm before we start.
          </p>
          <Link to="/book" className="btn-primary shrink-0">
            Book an appointment
          </Link>
        </div>
      </div>
    </section>
  );
}
