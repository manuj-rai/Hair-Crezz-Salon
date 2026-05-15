import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, Images, Phone, Scissors, Star, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type ComponentType, type MouseEvent } from 'react';
import { site } from '../config/site';
import { primaryNav } from '../config/nav';
import { cn } from '../lib/utils';

const navIcons = {
  Services: Scissors,
  Stylists: Users,
  Gallery: Images,
  Reviews: Star,
  Contact: Phone,
};

type MobileNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export default function Header() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const onLanding = pathname === '/';
  // Booking flow owns its own bottom-fixed action bar — don't stack a second
  // navbar underneath it on mobile.
  const hideMobileBottomNav = pathname.startsWith('/book');

  // Build a 4-slot mobile nav: Home · {two section links} · Contact
  const mobileSections = ['Services', 'Gallery', 'Stylists']
    .map((label) => primaryNav.find((item) => item.label === label))
    .filter((item): item is (typeof primaryNav)[number] => Boolean(item))
    .slice(0, 2)
    .map(toBottomNavItem);
  const contactItem = primaryNav.find((item) => item.label === 'Contact');
  const sideItems: MobileNavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    ...mobileSections,
    ...(contactItem ? [toBottomNavItem(contactItem)] : []),
  ].slice(0, 4);
  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2, 4);

  const sectionIds = sideItems
    .map((item) => (item.href.includes('#') ? item.href.split('#')[1] : null))
    .filter((id): id is string => Boolean(id));
  const activeSection = useActiveSection(sectionIds, onLanding);

  const isItemActive = useCallback(
    (href: string): boolean => {
      if (href === '/') return onLanding && !activeSection;
      if (href.includes('#')) {
        const id = href.split('#')[1];
        return onLanding && activeSection === id;
      }
      return pathname.startsWith(href);
    },
    [onLanding, activeSection, pathname],
  );

  // Home tap: scroll to top when already on landing, else navigate.
  const onHomeClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (onLanding) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [onLanding],
  );

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border/60">
        <div className="container-x flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <Link
            to="/"
            onClick={onHomeClick}
            className="flex items-center gap-2 group min-w-0"
          >
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

      {/* Mobile bottom nav — flat 5-cell bar with Book as the emphasized middle action.
          Hidden inside the booking flow so the booking ActionBar owns the bottom slot. */}
      <nav
        aria-label="Primary"
        className={cn(
          'lg:hidden fixed inset-x-0 bottom-0 z-50 safe-pb border-t border-ink/[0.08] bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80 shadow-[0_-2px_14px_-8px_rgb(0_0_0/0.18)]',
          hideMobileBottomNav && 'hidden',
        )}
      >
        <div className="grid h-[58px] grid-cols-5">
          {leftItems.map((item) => (
            <BottomNavItem
              key={item.href}
              item={item}
              active={isItemActive(item.href)}
              onClick={item.href === '/' ? onHomeClick : undefined}
            />
          ))}
          {Array.from({ length: Math.max(0, 2 - leftItems.length) }).map((_, i) => (
            <span key={`left-${i}`} />
          ))}

          <button
            type="button"
            onClick={() => nav('/book')}
            aria-label="Book appointment"
            aria-current={pathname === '/book' ? 'page' : undefined}
            className={cn(
              'group relative flex flex-col items-center justify-end pb-1 text-[10px] font-semibold tracking-wide transition active:scale-95',
              pathname === '/book' ? 'text-accent' : 'text-ink hover:text-accent',
            )}
          >
            {/* Popped circle — sits above the bar with a ring of bg to look detached */}
            <span className="relative -mt-5 mb-1 book-bob">
              {/* Soft pulsing halo — attention without being shouty */}
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-accent/45 book-halo"
              />
              <span
                className={cn(
                  'relative grid h-12 w-12 place-items-center rounded-full ring-[3px] ring-bg shadow-glow transition-all duration-200 group-hover:scale-[1.04] group-active:scale-95',
                  pathname === '/book'
                    ? 'bg-ink text-primary-fg'
                    : 'bg-accent text-accent-fg',
                )}
              >
                <Calendar className="h-[18px] w-[18px]" />
              </span>
            </span>
            <span className="leading-none uppercase tracking-[0.18em]">Book</span>
          </button>

          {rightItems.map((item) => (
            <BottomNavItem key={item.href} item={item} active={isItemActive(item.href)} />
          ))}
          {Array.from({ length: Math.max(0, 2 - rightItems.length) }).map((_, i) => (
            <span key={`right-${i}`} />
          ))}
        </div>
      </nav>
    </>
  );
}

function toBottomNavItem(item: (typeof primaryNav)[number]): MobileNavItem {
  return {
    label: item.label,
    href: item.href.startsWith('#') ? `/${item.href}` : item.href,
    icon: navIcons[item.label as keyof typeof navIcons] ?? Home,
  };
}

function BottomNavItem({
  item,
  active,
  onClick,
}: {
  item: MobileNavItem;
  active: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition active:scale-95',
        active ? 'text-accent' : 'text-muted hover:text-ink',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0 h-[2px] rounded-b-full bg-accent transition-all duration-300',
          active ? 'w-6 opacity-100' : 'w-0 opacity-0',
        )}
      />
      <Icon
        className={cn(
          'h-[18px] w-[18px] transition-transform',
          active ? 'scale-110' : 'group-hover:scale-105',
        )}
      />
      <span className={cn('leading-none tracking-wide', active && 'font-semibold')}>
        {item.label}
      </span>
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
