import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { site } from '../../config/site';

export default function AdminLoginPage() {
  const { signIn, mode } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('demo@admin.com');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back');
      nav('/admin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      {/* Editorial visual panel — hidden on mobile */}
      <aside className="hidden lg:flex relative overflow-hidden grain bg-ink text-primary-fg">
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50 kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/60 to-transparent" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link to="/" className="block">
            <div className="text-[11px] uppercase tracking-[0.28em] text-primary-fg/70">
              {site.shortName}
            </div>
            <div className="font-display text-2xl mt-1">Workspace</div>
          </Link>
          <div className="max-w-md">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Admin</p>
            <h2 className="font-display text-4xl xl:text-5xl leading-[1.05] tracking-tight mt-3">
              The chair behind <span className="italic text-accent">the chair</span>.
            </h2>
            <p className="text-sm text-primary-fg/75 mt-5 max-w-sm leading-relaxed">
              Manage bookings, services and stylists from one place — built for the people running the salon.
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-fg/55">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </aside>

      {/* Form column */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="block mb-10 lg:hidden">
            <div className="eyebrow-ink">{site.shortName}</div>
            <div className="font-display text-2xl mt-1">Workspace</div>
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow">Staff access</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            Sign <span className="italic text-accent">in</span>.
          </h1>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Manage bookings and the salon menu.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Password</span>
                <Lock className="h-3.5 w-3.5 text-muted" />
              </label>
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'demo' && (
            <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
              <span className="font-semibold uppercase tracking-[0.2em] text-[10px] block mb-1">
                Demo mode
              </span>
              Credentials are prefilled. Configure Supabase env vars for live auth.
            </div>
          )}

          <p className="mt-8 text-xs text-muted text-center">
            <Link to="/" className="hover:text-ink transition">
              ← Back to public site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
