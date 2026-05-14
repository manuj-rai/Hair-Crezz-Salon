import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, FolderTree, LayoutDashboard, LogOut, Menu, Scissors, Users, X } from 'lucide-react';
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
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 border-b border-border bg-bg/95 backdrop-blur">
        <button
          aria-label="Open menu"
          onClick={openDrawer}
          className="h-9 w-9 rounded-lg border border-border bg-surface grid place-items-center text-ink active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center -mt-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted leading-none">{site.shortName} Admin</span>
          <span className="font-display text-base leading-tight">{currentLabel}</span>
        </div>
        <Link
          to="/"
          aria-label="Back to public site"
          className="h-9 w-9 rounded-lg border border-border bg-surface grid place-items-center text-ink active:scale-95 transition-transform"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile drawer */}
      {drawerVisible && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className={cn(
              'absolute inset-0 bg-primary/40 backdrop-blur-sm',
              drawerClosing ? 'animate-fade-out' : 'animate-fade-in',
            )}
            onClick={closeDrawer}
          />
          <aside
            className={cn(
              'absolute left-0 top-0 h-full w-[260px] bg-surface border-r border-border flex flex-col shadow-xl will-change-transform',
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
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen border-r border-border bg-surface flex-col">
        <div className="p-5">
          <Link to="/" className="font-display text-lg leading-tight block">{site.name}</Link>
          <span className="text-xs text-muted">Admin Panel</span>
          <span className={cn(
            'mt-2 inline-block badge',
            repo.mode === 'demo' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
          )}>
            {repo.mode === 'demo' ? 'Demo data' : 'Connected to Supabase'}
          </span>
        </div>
        <NavList />
        <UserPanel email={user?.email} onSignOut={async () => { await signOut(); nav('/admin/login'); }} />
      </aside>

      <main className="p-3 sm:p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div>
        <Link to="/" className="font-display text-lg leading-tight block">{site.name}</Link>
        <span className="text-xs text-muted">Admin Panel</span>
        <span className={cn(
          'mt-2 inline-block badge',
          repo.mode === 'demo' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
        )}>
          {repo.mode === 'demo' ? 'Demo' : 'Live'}
        </span>
      </div>
      <button onClick={onClose} aria-label="Close menu" className="text-muted hover:text-ink">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function NavList() {
  return (
    <nav className="px-3 py-3 space-y-1 flex-1 overflow-y-auto">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
              isActive ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-bg hover:text-ink',
            )
          }
        >
          <l.icon className="h-4 w-4" />
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserPanel({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="p-4 border-t border-border">
      <div className="text-xs text-muted truncate mb-2">{email}</div>
      <button onClick={onSignOut} className="btn-outline btn-sm w-full">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
