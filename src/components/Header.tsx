import { Link, NavLink, useLocation } from 'react-router-dom';
import { Calendar, Home, Images, Phone, Scissors, Star, Users } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
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

  const { pathname } = useLocation();
  const sectionIds = bottomNav
    .map((item) => (item.href.includes('#') ? item.href.split('#')[1] : null))
    .filter((id): id is string => Boolean(id));
  const activeSection = useActiveSection(sectionIds, pathname === '/');
  const onLanding = pathname === '/';

  function isItemActive(href: string): boolean {
    if (href === '/') return onLanding && !activeSection;
    if (href.includes('#')) {
      const id = href.split('#')[1];
      return onLanding && activeSection === id;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border/60">
        <div className="container-x flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <span className="grid place-items-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-fg font-display font-bold shrink-0">
              {site.shortName.charAt(0)}
            </span>
            <span className="font-display text-base sm:text-xl tracking-tight truncate">
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

          <a
            href={`tel:${site.contact.phone}`}
            aria-label="Call salon"
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink shrink-0"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="lg:hidden fixed inset-x-0 bottom-0 z-50 safe-pb border-t border-border bg-surface/95 backdrop-blur shadow-[0_-4px_20px_-12px_rgb(0_0_0/0.18)]"
      >
        <div className="grid h-16 grid-cols-5 px-1">
          {leftBottomNav.map((item) => (
            <BottomNavItem key={item.href} item={item} active={isItemActive(item.href)} />
          ))}
          {Array.from({ length: Math.max(0, 2 - leftBottomNav.length) }).map((_, i) => <span key={`left-${i}`} />)}

          <div className="relative flex items-end justify-center">
            <NavLink
              to="/book"
              aria-label="Book appointment"
              className={({ isActive }) =>
                `group absolute -top-6 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold ring-4 ring-bg shadow-glow transition-all duration-200 active:scale-90 hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'bg-primary text-primary-fg hover:brightness-110'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {!isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-full bg-accent/35 animate-ping"
                    />
                  )}
                  <Calendar className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="leading-none">Book</span>
                </>
              )}
            </NavLink>
          </div>

          {rightBottomNav.map((item) => (
            <BottomNavItem key={item.href} item={item} active={isItemActive(item.href)} />
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
  active,
}: {
  item: { label: string; href: string; icon: ComponentType<{ className?: string }> };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={
        'group relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:scale-95 ' +
        (active ? 'text-accent' : 'text-muted hover:text-ink')
      }
    >
      <span
        aria-hidden
        className={
          'absolute top-0 h-0.5 rounded-b-full bg-accent transition-all duration-300 ' +
          (active ? 'w-8 opacity-100' : 'w-0 opacity-0')
        }
      />
      <span
        className={
          'grid h-7 w-10 place-items-center rounded-full transition-all duration-200 ' +
          (active ? 'bg-accent/12' : 'group-hover:bg-bg')
        }
      >
        <Icon className={'h-[18px] w-[18px] transition-transform ' + (active ? 'scale-110' : 'group-hover:scale-105')} />
      </span>
      <span className={'leading-none ' + (active ? 'font-semibold' : '')}>{item.label}</span>
    </Link>
  );
}

function useActiveSection(ids: string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');
  useEffect(() => {
    if (!enabled || ids.length === 0) {
      setActive(null);
      return;
    }
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        let best: [string, number] | null = null;
        for (const [id, ratio] of visible) {
          if (!best || ratio > best[1]) best = [id, ratio];
        }
        setActive(best?.[0] ?? null);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.1, 0.5, 1] },
    );
    let cancelled = false;
    let attempts = 0;
    const attach = () => {
      if (cancelled) return;
      const found = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el));
      if (found.length === 0 && attempts++ < 30) {
        setTimeout(attach, 100);
        return;
      }
      found.forEach((el) => obs.observe(el));
    };
    attach();
    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, [key, enabled, ids]);
  return active;
}
