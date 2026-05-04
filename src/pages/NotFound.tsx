import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3 mb-4">Page not found.</h1>
        <p className="text-muted mb-6">The page you're looking for has either moved or never existed.</p>
        <Link to="/" className="btn-primary">Take me home</Link>
      </div>
    </div>
  );
}
