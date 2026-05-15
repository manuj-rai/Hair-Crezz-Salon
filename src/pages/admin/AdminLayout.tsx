import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { repo } from '../../lib/repo';
import { site } from '../../config/site';
import { cn } from '../../lib/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/stylists', label: 'Stylists', icon: Users, enabled: site.sections.stylists },
  { to: '/admin/hours', label: 'Hours & blocks', icon: Clock },
].filter((link) => link.enabled ?? true);

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [drawerState, setDrawerState] = useState<'closed' | 'opening' | 'closing'>('closed');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeDrawer = useCallback(() => {
    setDrawerState((s) => (s === 'closed' ? s : 'closing'));
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDrawerState('closed'), 220);
  }, []);

  function openDrawer() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDrawerState('opening');
  }

  // Auto-close drawer on route change.
  useEffect(() => {
    if (drawerState !== 'closed') closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (drawerState === 'opening') {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [drawerState]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const currentLabel = links.find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to)))?.label ?? 'Admin';
  const drawerVisible = drawerState !== 'closed';
  const drawerClosing = drawerState === 'closing';

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[280px_1fr]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 border-b border-ink/[0.08] bg-bg/95 backdrop-blur">
        <button
          aria-label="Open menu"
          onClick={openDrawer}
          className="h-10 w-10 rounded-full border border-ink/15 bg-surface grid place-items-center text-ink active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center -mt-0.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted leading-none">
            {site.shortName} · Admin
          </span>
          <span className="font-display text-base leading-tight mt-0.5">{currentLabel}</span>
        </div>
        <Link
          to="/"
          aria-label="Back to public site"
          className="h-10 w-10 rounded-full border border-ink/15 bg-surface grid place-items-center text-ink active:scale-95 transition-transform"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile drawer */}
      {drawerVisible && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className={cn(
              'absolute inset-0 bg-ink/45 backdrop-blur-sm',
              drawerClosing ? 'animate-fade-out' : 'animate-fade-in',
            )}
            onClick={closeDrawer}
          />
          <aside
            className={cn(
              'absolute left-0 top-0 h-full w-[280px] bg-bg border-r border-ink/[0.08] flex flex-col shadow-xl will-change-transform',
              drawerClosing ? 'animate-slide-out-left' : 'animate-slide-in-left',
            )}
          >
            <DrawerHeader onClose={closeDrawer} />
            <NavList />
            <UserPanel email={user?.email} onSignOut={async () => { await signOut(); nav('/admin/login'); }} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen border-r border-ink/[0.08] bg-bg flex-col">
        <div className="px-6 py-6 border-b border-ink/[0.08]">
          <Link to="/" className="block">
            <div className="eyebrow-ink mb-1">{site.shortName}</div>
            <div className="font-display text-2xl leading-tight tracking-tight">Workspace</div>
          </Link>
          <div className="mt-3"><ModeBadge /></div>
        </div>
        <NavList />
        <UserPanel email={user?.email} onSignOut={async () => { await signOut(); nav('/admin/login'); }} />
      </aside>

      <div className="min-w-0">
        <header className="hidden lg:flex sticky top-0 z-20 h-14 items-center justify-between gap-4 border-b border-ink/[0.08] bg-bg/95 px-8 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0 text-xs">
            <span className="eyebrow-ink">Admin</span>
            <span className="h-3 w-px bg-ink/15" />
            <span className="text-ink/70 truncate">{currentLabel}</span>
          </div>
          <Link to="/" className="btn-outline btn-sm">
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1440px] p-4 pb-10 sm:p-6 sm:pb-12 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between p-5 border-b border-ink/[0.08]">
      <Link to="/" className="block">
        <div className="eyebrow-ink mb-1">{site.shortName}</div>
        <div className="font-display text-xl leading-tight tracking-tight">Workspace</div>
        <div className="mt-2"><ModeBadge /></div>
      </Link>
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="h-9 w-9 grid place-items-center rounded-full border border-ink/15 text-muted hover:text-ink transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NavList() {
  return (
    <nav className="px-3 py-5 space-y-0.5 flex-1 overflow-y-auto">
      <div className="px-3 mb-2 eyebrow-ink">Manage</div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition',
              isActive
                ? 'bg-ink text-primary-fg shadow-soft'
                : 'text-ink/70 hover:bg-ink/[0.04] hover:text-ink',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden
                className={cn(
                  'h-1 w-1 rounded-full transition',
                  isActive ? 'bg-accent' : 'bg-transparent',
                )}
              />
              <l.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate flex-1">{l.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserPanel({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="p-5 border-t border-ink/[0.08]">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent font-display">
          {(email ?? 'A').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Signed in</div>
          <div className="text-xs font-medium truncate">{email}</div>
        </div>
      </div>
      <button onClick={onSignOut} className="btn-outline btn-sm w-full">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function ModeBadge() {
  const live = repo.mode !== 'demo';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ring-1 ring-inset',
        live
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
          : 'bg-amber-50 text-amber-900 ring-amber-200',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-emerald-500' : 'bg-amber-500')} />
      {live ? 'Live' : 'Demo'}
    </span>
  );
}

