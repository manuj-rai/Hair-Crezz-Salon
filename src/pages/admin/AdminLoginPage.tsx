import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { site } from '../../config/site';

export default function AdminLoginPage() {
  const { signIn, mode } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(mode === 'demo' ? 'admin@demo.local' : '');
  const [password, setPassword] = useState(mode === 'demo' ? 'admin' : '');
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
    <div className="min-h-screen grid place-items-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center font-display text-2xl mb-8">
          {site.name}
        </Link>

        <div className="card p-8">
          <div className="grid place-items-center h-12 w-12 rounded-full bg-accent/10 text-accent mx-auto mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-center font-display text-2xl mb-1">Staff sign in</h1>
          <p className="text-center text-sm text-muted mb-6">Manage bookings and the salon menu.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          {mode === 'demo' && (
            <p className="text-xs text-muted mt-4 text-center">
              Demo mode — credentials prefilled. Configure Supabase for real auth.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
