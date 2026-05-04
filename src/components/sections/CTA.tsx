import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section">
      <div className="container-x">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-16 sm:px-16 sm:py-20 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-ink)))',
            color: 'rgb(var(--c-primary-fg))',
          }}
        >
          <div
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'rgb(var(--c-accent))' }}
          />
          <p className="eyebrow !text-accent">Ready when you are</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4">
            Treat yourself this week.
          </h2>
          <p className="text-primary-fg/70 max-w-xl mx-auto mb-8">
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
