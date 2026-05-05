import { Link, NavLink } from 'react-router-dom';
import { Calendar, Home, Images, Phone, Scissors, Star, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { site } from '../config/site';
import { primaryNav } from '../config/nav';

const navIcons = {
  Services: Scissors,
  Stylists: Users,
  Gallery: Images,
  Reviews: Star,
  Contact: Phone,
};

export default function Header() {
  const mobilePrimary = ['Services', 'Gallery', 'Stylists']
    .map((label) => primaryNav.find((item) => item.label === label))
    .filter((item): item is (typeof primaryNav)[number] => Boolean(item))
    .slice(0, 2);
  const contactItem = primaryNav.find((item) => item.label === 'Contact');
  const bottomNav = [
    { label: 'Home', href: '/', icon: Home },
    ...mobilePrimary.map(toBottomNavItem),
    ...(contactItem ? [toBottomNavItem(contactItem)] : []),
  ].slice(0, 4);
  const leftBottomNav = bottomNav.slice(0, 2);
  const rightBottomNav = bottomNav.slice(2, 4);

  return (
    <>
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
              <Link
                key={n.href}
                to={n.href.startsWith('#') ? `/${n.href}` : n.href}
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                {n.label}
              </Link>
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

          <a href={`tel:${site.contact.phone}`} className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink">
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </header>

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 h-14 border-t border-border bg-surface/95 backdrop-blur">
        <div className="grid h-full grid-cols-5">
          {leftBottomNav.map((item) => (
            <BottomNavItem key={item.href} item={item} />
          ))}
          {Array.from({ length: Math.max(0, 2 - leftBottomNav.length) }).map((_, i) => <span key={`left-${i}`} />)}

          <NavLink
            to="/book"
            aria-label="Book appointment"
            className={({ isActive }) =>
              `flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-muted hover:text-ink'
              }`
            }
          >
            <Calendar className="h-4 w-4" />
            <span>Book</span>
          </NavLink>

          {rightBottomNav.map((item) => (
            <BottomNavItem key={item.href} item={item} />
          ))}
          {Array.from({ length: Math.max(0, 2 - rightBottomNav.length) }).map((_, i) => <span key={`right-${i}`} />)}
        </div>
      </nav>
    </>
  );
}

function toBottomNavItem(item: (typeof primaryNav)[number]) {
  return {
    ...item,
    href: item.href.startsWith('#') ? `/${item.href}` : item.href,
    icon: navIcons[item.label as keyof typeof navIcons] ?? Home,
  };
}

function BottomNavItem({
  item,
}: {
  item: { label: string; href: string; icon: ComponentType<{ className?: string }> };
}) {
  const Icon = item.icon;
  return (
    <Link to={item.href} className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted hover:text-ink">
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}
