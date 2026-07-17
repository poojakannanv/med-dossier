import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the profile dropdown when clicking elsewhere.
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <form onSubmit={handleSearch} className="flex-1" role="search">
        <label htmlFor="global-search" className="sr-only">
          Search products, submissions and documents
        </label>
        <div className="relative max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="global-search"
            type="search"
            className="input pl-9"
            placeholder="Search products, submissions, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          aria-label="Open profile menu"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-slate-700">{user ? user.name : ''}</span>
            <span className="block text-xs text-slate-400">{user ? ROLE_LABELS[user.role] : ''}</span>
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg" role="menu">
            <div className="border-b border-slate-100 px-4 pb-2">
              <p className="text-sm font-medium text-slate-700">{user ? user.name : ''}</p>
              <p className="truncate text-xs text-slate-400">{user ? user.email : ''}</p>
            </div>
            <button
              type="button"
              className="mt-1 block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              role="menuitem"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
