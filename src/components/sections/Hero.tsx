import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { site } from '../../config/site';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-surface" />
        <div
          className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgb(var(--c-accent))' }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[320px] w-[320px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'rgb(var(--c-primary))' }}
        />
      </div>

      <div className="container-x pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Premium unisex salon · Trusted by 5,000+ clients
          </div>

          <h1 className="h-display mb-6">
            {site.tagline.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="italic text-accent">{site.tagline.split(' ').slice(-1)}</span>
          </h1>

          <p className="text-lg text-muted max-w-xl mb-8 leading-relaxed">
            {site.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="btn-primary">
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#services" className="btn-outline">
              Explore Services
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-bg shimmer-bg animate-shimmer bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://i.pravatar.cc/80?img=${i + 10})`,
                  }}
                />
              ))}
            </div>
            <div>
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-muted mt-0.5">4.9 / 5 from 500+ reviews</p>
            </div>
          </div>
        </div>

        <div className="relative animate-slide-up">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-glow">
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=85"
              alt="Salon interior"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-primary-fg">
              <p className="font-display text-2xl">A space designed for you.</p>
            </div>
          </div>

          {/* floating mini-card */}
          <div className="hidden md:block absolute -left-6 top-12 card p-4 w-56 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-xs text-muted">Today's slots</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['11:00', '12:30', '15:00', '17:00', '18:30'].map((t) => (
                <span key={t} className="badge bg-accent/10 text-ink">{t}</span>
              ))}
            </div>
          </div>

          <div className="hidden md:flex absolute -right-4 bottom-12 card p-4 items-center gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="grid place-items-center h-10 w-10 rounded-full bg-accent text-accent-fg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Free consultation</div>
              <div className="text-xs text-muted">on first visit</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
