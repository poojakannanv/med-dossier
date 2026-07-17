import { Link } from 'react-router-dom';

const EmptyState = ({ title, message, actionLabel, actionTo }) => (
  <div className="card flex flex-col items-center py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl" aria-hidden="true">
      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
    <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    {actionLabel && actionTo && (
      <Link to={actionTo} className="btn-primary mt-5">
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;
