import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Instagram, Facebook } from './BrandIcons';
import { Link } from 'react-router-dom';
import { site } from '../config/site';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-fg mt-24">
      <div className="container-x py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-2xl mb-3">{site.name}</div>
          <p className="text-primary-fg/70 max-w-xs leading-relaxed">{site.description}</p>
          <div className="flex gap-3 mt-5">
            {site.social.instagram && (
              <a href={site.social.instagram} target="_blank" rel="noreferrer" className="grid place-items-center h-10 w-10 rounded-full border border-primary-fg/20 hover:bg-accent hover:text-accent-fg hover:border-accent transition">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {site.social.facebook && (
              <a href={site.social.facebook} target="_blank" rel="noreferrer" className="grid place-items-center h-10 w-10 rounded-full border border-primary-fg/20 hover:bg-accent hover:text-accent-fg hover:border-accent transition">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-accent">Visit</h4>
          <p className="flex items-start gap-3 text-primary-fg/80 text-sm leading-relaxed">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {site.contact.address.line1}<br />
              {site.contact.address.line2}
            </span>
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-accent">Contact</h4>
          <ul className="space-y-2 text-sm text-primary-fg/80">
            <li><a href={`tel:${site.contact.phone}`} className="flex items-center gap-3 hover:text-accent"><Phone className="h-4 w-4" />{site.contact.phone}</a></li>
            <li><a href={`mailto:${site.contact.email}`} className="flex items-center gap-3 hover:text-accent"><Mail className="h-4 w-4" />{site.contact.email}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-accent flex items-center gap-2"><Clock className="h-4 w-4" />Hours</h4>
          <ul className="space-y-1.5 text-sm text-primary-fg/80">
            {site.hours.map((h) => (
              <li key={h.day} className="flex justify-between">
                <span>{h.day}</span>
                <span>{h.open} – {h.close}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-fg/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-fg/60">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>
            <Link to="/admin/login" className="hover:text-accent">Staff Login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
