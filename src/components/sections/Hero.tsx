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

      <div className="container-x pt-6 pb-10 sm:pt-10 sm:pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 xl:gap-12 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-3 py-1 text-[11px] sm:text-xs font-medium mb-3 sm:mb-4 max-w-full">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Premium unisex salon · Trusted by 5,000+ clients</span>
          </div>

          <h1 className="font-display text-[2rem] sm:text-5xl xl:text-6xl leading-[1.05] tracking-tight mb-4">
            {site.tagline.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="italic text-accent">{site.tagline.split(' ').slice(-1)}</span>
          </h1>

          <p className="text-sm sm:text-lg text-muted max-w-xl mb-5 sm:mb-6 leading-relaxed">
            {site.description}
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <Link to="/book" className="btn-primary flex-1 sm:flex-none min-w-[160px]">
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#services" className="btn-outline flex-1 sm:flex-none min-w-[140px]">
              Explore Services
            </a>
          </div>

          <div className="mt-6 sm:mt-7 flex items-center gap-4 sm:gap-5">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-bg shimmer-bg animate-shimmer bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://i.pravatar.cc/80?img=${i + 10})`,
                  }}
                />
              ))}
            </div>
            <div>
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                ))}
              </div>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">4.9 / 5 from 500+ reviews</p>
            </div>
          </div>
        </div>

        <div className="relative animate-slide-up">
          <div className="relative aspect-[4/3] lg:aspect-[5/4] max-h-[300px] sm:max-h-[420px] xl:max-h-[500px] rounded-2xl overflow-hidden shadow-glow">
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=85"
              alt="Salon interior"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-primary-fg">
              <p className="font-display text-xl sm:text-2xl">A space designed for you.</p>
            </div>
          </div>

          {/* floating mini-card */}
          <div className="hidden md:block absolute -left-5 top-8 card p-4 w-56 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-xs text-muted">Today's slots</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['11:00', '12:30', '15:00', '17:00', '18:30'].map((t) => (
                <span key={t} className="badge bg-accent/10 text-ink">{t}</span>
              ))}
            </div>
          </div>

          <div className="hidden md:flex absolute -right-3 bottom-8 card p-4 items-center gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
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
