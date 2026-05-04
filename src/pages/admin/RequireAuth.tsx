import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}
