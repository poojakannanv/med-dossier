import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { formatDate, formatDateTime } from '../utils/format';

const SectionHeading = ({ children, count }) => (
  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    {children}
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{count}</span>
  </h2>
);

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q } });
        if (active) setResults(res.data.results);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Search failed'));
        if (active) setResults(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [q]);

  const totalHits = results
    ? results.products.length + results.submissions.length + results.documents.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Search results</h1>
        <p className="mt-1 text-sm text-slate-500">
          {q ? `Results for "${q}"` : 'Use the search bar above to search products, submissions and documents.'}
        </p>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : !results ? (
        <EmptyState
          title="Start searching"
          message="Type at least 2 characters in the search bar in the header to search across the whole platform."
        />
      ) : totalHits === 0 ? (
        <EmptyState
          title="No results"
          message={`Nothing matched "${q}". Try a shorter term or check the spelling.`}
        />
      ) : (
        <div className="space-y-6">
          <section className="card">
            <SectionHeading count={results.products.length}>Products</SectionHeading>
            {results.products.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No matching products.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {results.products.map((p) => (
                  <li key={p._id} className="py-3">
                    <Link to={`/products/${p._id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                      {p.productName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {p.activeIngredient} · <span className="capitalize">{p.dosageForm}</span> · {p.strength} · {p.manufacturer}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <SectionHeading count={results.submissions.length}>Submissions</SectionHeading>
            {results.submissions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No matching submissions.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {results.submissions.map((s) => (
                  <li key={s._id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <Link to={`/submissions/${s._id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        {s.productId ? s.productId.productName : 'Unknown product'}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {s.regulatoryAuthority} · <span className="capitalize">{s.submissionType}</span> · target {formatDate(s.targetDate)}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <SectionHeading count={results.documents.length}>Documents</SectionHeading>
            {results.documents.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No matching documents.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {results.documents.map((d) => (
                  <li key={d.documentId} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <Link
                        to={`/submissions/${d.submissionId}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        {d.originalName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        v{d.version}
                        {d.isCurrent ? ' (current)' : ''} · module {d.moduleCode} ·{' '}
                        {d.productName || 'Unknown product'} · {formatDateTime(d.uploadedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
