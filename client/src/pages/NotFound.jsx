import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
    <p className="text-6xl font-bold text-brand-600">404</p>
    <h1 className="mt-4 text-2xl font-semibold text-slate-800">Page not found</h1>
    <p className="mt-2 max-w-md text-sm text-slate-500">
      The page you are looking for does not exist or may have been moved.
    </p>
    <Link to="/dashboard" className="btn-primary mt-6">
      Back to dashboard
    </Link>
  </div>
);

export default NotFound;
