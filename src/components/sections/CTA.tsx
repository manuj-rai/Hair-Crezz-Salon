import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section">
      <div className="container-x">
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-ink)))',
            color: 'rgb(var(--c-primary-fg))',
          }}
        >
          <div
            className="absolute -top-24 -right-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'rgb(var(--c-accent))' }}
          />
          <p className="eyebrow !text-accent">Ready when you are</p>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl mt-3 mb-3 sm:mb-4">
            Treat yourself this week.
          </h2>
          <p className="text-sm sm:text-base text-primary-fg/70 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Pick a service, choose your stylist, and lock in a slot — it takes less than a minute.
          </p>
          <Link to="/book" className="btn-accent">
            Book an appointment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
