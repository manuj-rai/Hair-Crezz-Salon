import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';
import { site } from '../../config/site';

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container-x grid lg:grid-cols-2 gap-10">
        <div className="card overflow-hidden">
          <iframe
            title="Map"
            src={site.mapEmbed}
            className="w-full h-[360px] lg:h-full min-h-[320px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div>
          <p className="eyebrow">Visit us</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-3 mb-6">Come say hello.</h2>

          <ul className="space-y-5 text-sm">
            <li className="flex items-start gap-4">
              <div className="grid place-items-center h-10 w-10 rounded-full bg-accent/10 text-accent shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold mb-0.5">Address</div>
                <p className="text-muted leading-relaxed">{site.contact.address.line1}, {site.contact.address.line2}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="grid place-items-center h-10 w-10 rounded-full bg-accent/10 text-accent shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold mb-0.5">Phone</div>
                <a href={`tel:${site.contact.phone}`} className="text-muted hover:text-ink">{site.contact.phone}</a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="grid place-items-center h-10 w-10 rounded-full bg-accent/10 text-accent shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold mb-1">Opening hours</div>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted">
                  {site.hours.map((h) => (
                    <li key={h.day} className="flex justify-between">
                      <span>{h.day}</span>
                      <span>{h.open}–{h.close}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          </ul>

          <Link to="/book" className="btn-primary mt-8">
            <Calendar className="h-4 w-4" /> Book Your Visit
          </Link>
        </div>
      </div>
    </section>
  );
}
