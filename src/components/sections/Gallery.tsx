import { useEffect, useState } from 'react';
import type { GalleryImage } from '../../types/db';
import { repo } from '../../lib/repo';

export default function Gallery() {
  const [items, setItems] = useState<GalleryImage[] | null>(null);

  useEffect(() => {
    repo.listGallery().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <section id="gallery" className="section">
      <div className="container-x">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="eyebrow">Our work</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3">A look inside.</h2>
          </div>
          <p className="text-muted max-w-xs">Recent transformations, ambient corners and happy clients.</p>
        </div>

        {!items ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl shimmer-bg animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((g, i) => (
              <a
                key={g.id}
                href={g.url}
                target="_blank"
                rel="noreferrer"
                className={
                  'group relative overflow-hidden rounded-xl ' +
                  (i % 7 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square')
                }
              >
                <img
                  src={g.url}
                  alt={g.caption ?? 'Gallery image'}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {g.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-primary/80 to-transparent text-primary-fg text-xs opacity-0 group-hover:opacity-100 transition">
                    {g.caption}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
