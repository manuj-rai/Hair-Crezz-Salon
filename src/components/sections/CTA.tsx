import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[4px] grain">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1800&q=85"
              alt=""
              className="h-full w-full object-cover kenburns"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/60 to-primary/40" />
          </div>

          <div className="relative grid lg:grid-cols-12 gap-8 items-center px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-28 text-primary-fg">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Ready when you are
                </span>
              </div>

              <h2 className="font-display font-medium leading-[1.02] tracking-[-0.01em] text-[2rem] sm:text-[3rem] lg:text-[4rem]">
                Treat yourself <span className="italic">this week</span>.
              </h2>

              <p className="mt-5 text-primary-fg/80 max-w-[48ch] text-sm sm:text-base leading-relaxed">
                Pick a service, choose your time, and lock in a slot — it takes less than a minute, and you'll get a real confirmation, not a callback later.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 lg:items-end">
              <Link to="/book" className="btn-accent btn-lg w-full sm:w-auto justify-center">
                Book an appointment <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/918799933509"
                target="_blank"
                rel="noreferrer"
                className="btn btn-lg border border-primary-fg/25 text-primary-fg hover:bg-primary-fg/10 w-full sm:w-auto justify-center"
              >
                Chat on WhatsApp
              </a>
              <span className="text-[11px] uppercase tracking-[0.22em] text-primary-fg/60 mt-1">
                Avg. response · under 5 min
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
