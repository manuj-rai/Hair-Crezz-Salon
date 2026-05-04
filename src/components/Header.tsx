import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone, Calendar } from 'lucide-react';
import { useState } from 'react';
import { site } from '../config/site';
import { primaryNav } from '../config/nav';
import { cn } from '../lib/utils';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border/60">
      <div className="container-x flex items-center justify-between h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-fg font-display font-bold">
            {site.shortName.charAt(0)}
          </span>
          <span className="font-display text-xl tracking-tight">
            {site.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {primaryNav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href={`tel:${site.contact.phone}`} className="btn-ghost btn-sm">
            <Phone className="h-4 w-4" /> {site.contact.phone}
          </a>
          <NavLink to="/book" className="btn-primary btn-sm">
            <Calendar className="h-4 w-4" /> Book Now
          </NavLink>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          'lg:hidden overflow-hidden transition-[max-height] duration-300 ease-out border-t border-border/60',
          open ? 'max-h-[480px]' : 'max-h-0',
        )}
      >
        <div className="container-x py-4 flex flex-col gap-1">
          {primaryNav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="py-3 px-2 text-base font-medium border-b border-border/40 last:border-0"
            >
              {n.label}
            </a>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <a href={`tel:${site.contact.phone}`} className="btn-outline btn-sm">
              <Phone className="h-4 w-4" /> Call
            </a>
            <NavLink to="/book" onClick={() => setOpen(false)} className="btn-primary btn-sm">
              <Calendar className="h-4 w-4" /> Book
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}
