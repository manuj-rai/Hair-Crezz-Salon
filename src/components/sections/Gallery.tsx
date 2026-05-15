import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { GalleryImage } from '../../types/db';
import { repo } from '../../lib/repo';
import { cn } from '../../lib/utils';

// Bento layout pattern. Repeats every 6 items.
// Keeps total row heights consistent enough to look intentional.
const BENTO = [
  'col-span-2 row-span-2 aspect-square',
  'col-span-1 aspect-square',
  'col-span-1 aspect-square',
  'col-span-1 aspect-square',
  'col-span-1 aspect-square',
  'col-span-2 aspect-[2/1]',
];

export default function Gallery() {
  const [items, setItems] = useState<GalleryImage[] | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    repo.listGallery().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (!items) return;
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === 'ArrowLeft')
        setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, items]);

  return (
    <section id="gallery" className="section bg-bg">
      <div className="container-x">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 sm:mb-14">
          <div className="max-w-xl">
            <p className="eyebrow">The portfolio</p>
            <h2 className="h-display mt-4">
              A look <span className="italic text-accent">inside</span>.
            </h2>
          </div>
          <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed">
            Recent transformations, ambient corners, and happy clients — refreshed monthly.
          </p>
        </div>

        {!items ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn('shimmer-bg animate-shimmer rounded-[2px]', BENTO[i % BENTO.length])} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">No images yet.</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 auto-rows-fr">
            {items.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'group relative overflow-hidden rounded-[2px] bg-ink/5 text-left',
                  BENTO[i % BENTO.length],
                )}
              >
                <img
                  src={g.url}
                  alt={g.caption ?? 'Gallery image'}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {g.caption && (
                  <span className="absolute inset-x-3 bottom-3 text-primary-fg text-xs sm:text-sm font-display italic translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                    {g.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {active !== null && items && items[active] && (
        <Lightbox
          image={items[active]}
          onClose={() => setActive(null)}
          onPrev={() => setActive((active - 1 + items.length) % items.length)}
          onNext={() => setActive((active + 1) % items.length)}
          counter={`${active + 1} / ${items.length}`}
        />
      )}
    </section>
  );
}

function Lightbox({
  image,
  onClose,
  onPrev,
  onNext,
  counter,
}: {
  image: GalleryImage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  counter: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-sm flex flex-col animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 sm:p-6 text-primary-fg">
        <span className="text-[11px] uppercase tracking-[0.24em] opacity-80">{counter}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="h-10 w-10 grid place-items-center rounded-full border border-primary-fg/25 hover:bg-primary-fg/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex-1 grid place-items-center px-4 pb-4 sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.caption ?? ''}
          className="max-h-full max-w-full object-contain rounded-[2px] shadow-glow"
        />
      </div>

      <div
        className="flex items-center justify-between gap-3 p-4 sm:p-6 text-primary-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="h-11 w-11 grid place-items-center rounded-full border border-primary-fg/25 hover:bg-primary-fg/10 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="font-display italic text-center text-sm sm:text-base px-2 line-clamp-2 max-w-xl">
          {image.caption ?? ''}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          className="h-11 w-11 grid place-items-center rounded-full border border-primary-fg/25 hover:bg-primary-fg/10 transition"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
