import { Link } from 'react-router-dom';
import { Calendar, MapPin, MessageCircle, Phone } from 'lucide-react';
import { site } from '../../config/site';

export default function Contact() {
  const todayDow = new Date().getDay();
  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <section id="contact" className="section bg-bg">
      <div className="container-x">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Info column */}
          <div className="lg:col-span-5">
            <p className="eyebrow">Visit us</p>
            <h2 className="h-display mt-4">
              Come say <span className="italic text-accent">hello</span>.
            </h2>
            <p className="text-muted mt-5 text-sm sm:text-base leading-relaxed max-w-[42ch]">
              Walk-ins welcome when we have the chairs — booking ahead gets you the time you want.
            </p>

            <div className="mt-8 sm:mt-10 space-y-6">
              <Row icon={MapPin} title="Address">
                <p className="text-muted leading-relaxed">
                  {site.contact.address.line1}<br />
                  {site.contact.address.line2}
                </p>
              </Row>

              <Row icon={Phone} title="Phone">
                <a
                  href={`tel:${site.contact.phone}`}
                  className="text-ink hover:text-accent transition tabular-nums"
                >
                  {site.contact.phone}
                </a>
              </Row>

              <Row icon={MessageCircle} title="WhatsApp">
                <a
                  href={`https://wa.me/${site.contact.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-accent transition"
                >
                  Message us — usually under 5 min
                </a>
              </Row>
            </div>

            {/* Hours table — clean two-column grid with today highlighted */}
            <div className="mt-10 border-t border-ink/12 pt-6">
              <div className="eyebrow-ink mb-3">Opening hours</div>
              <ul className="grid grid-cols-1 gap-y-1 text-sm">
                {site.hours.map((h) => {
                  const today = dayKeys[todayDow] === h.day;
                  return (
                    <li
                      key={h.day}
                      className="flex items-baseline justify-between gap-3 py-1.5"
                    >
                      <span
                        className={
                          today
                            ? 'font-semibold text-ink flex items-center gap-2'
                            : 'text-muted'
                        }
                      >
                        {h.day}
                        {today && (
                          <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="flex-1 mx-3 hidden sm:block border-b border-dotted border-ink/15 self-end mb-[6px]" />
                      <span
                        className={`tabular-nums ${today ? 'text-ink' : 'text-muted'}`}
                      >
                        {h.open} – {h.close}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Link to="/book" className="btn-primary btn-lg mt-10">
              <Calendar className="h-4 w-4" /> Book your visit
            </Link>
          </div>

          {/* Map column */}
          <div className="lg:col-span-7 relative">
            <div className="rounded-[2px] overflow-hidden border border-ink/10 shadow-soft">
              <iframe
                title="Map"
                src={site.mapEmbed}
                className="w-full h-[280px] sm:h-[420px] lg:h-[540px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid place-items-center h-10 w-10 rounded-full border border-ink/15 text-accent shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 pt-1.5">
        <div className="eyebrow-ink mb-1">{title}</div>
        <div className="text-sm sm:text-[15px]">{children}</div>
      </div>
    </div>
  );
}
