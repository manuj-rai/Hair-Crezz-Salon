import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, FolderTree, LayoutDashboard, LogOut, Menu, Scissors, Users, X } from 'lucide-react';
import { useState } from 'react';
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
  { to: '/admin/hours', label: 'Business hours', icon: Clock },
].filter((link) => link.enabled ?? true);

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* mobile top bar */}
      <div className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-surface">
        <Link to="/" className="font-display">{site.name} · Admin</Link>
        <button aria-label="menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* sidebar */}
      <aside
        className={cn(
          'border-r border-border bg-surface flex flex-col',
          'lg:sticky lg:top-0 lg:h-screen',
          open ? 'block' : 'hidden lg:flex',
        )}
      >
        <div className="p-6 hidden lg:block">
          <Link to="/" className="font-display text-lg leading-tight block">{site.name}</Link>
          <span className="text-xs text-muted">Admin Panel</span>
          <span className={cn(
            'mt-2 inline-block badge',
            repo.mode === 'demo' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
          )}>
            {repo.mode === 'demo' ? 'Demo data' : 'Connected to Supabase'}
          </span>
        </div>

        <nav className="px-3 py-2 lg:py-0 space-y-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
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

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted truncate mb-2">{user?.email}</div>
          <button
            onClick={async () => { await signOut(); nav('/admin/login'); }}
            className="btn-outline btn-sm w-full"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
