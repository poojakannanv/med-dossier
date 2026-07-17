import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { SUBMISSION_STATUSES, STATUS_LABELS } from '../utils/constants';
import { formatDate } from '../utils/format';

const Submissions = () => {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ submissions: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (status) params.status = status;
        const res = await api.get('/submissions', { params });
        if (active) setData(res.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load submissions'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [status, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.total} submission dossier{data.total === 1 ? '' : 's'}
          </p>
        </div>
        {canEdit && (
          <Link to="/submissions/new" className="btn-primary">
            New submission
          </Link>
        )}
      </div>

      <div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          className="input w-48"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {SUBMISSION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : data.submissions.length === 0 ? (
        <EmptyState
          title={status ? 'No matching submissions' : 'No submissions yet'}
          message={
            status
              ? 'No submissions have this status. Try clearing the filter.'
              : 'Create your first submission dossier to start tracking CTD modules.'
          }
          actionLabel={canEdit && !status ? 'New submission' : undefined}
          actionTo={canEdit && !status ? '/submissions/new' : undefined}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Authority</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Target date</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.submissions.map((sub) => (
                <tr
                  key={sub._id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => navigate(`/submissions/${sub._id}`)}
                >
                  <td className="px-5 py-3 font-medium text-brand-600">
                    {sub.productId ? sub.productId.productName : 'Unknown product'}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{sub.regulatoryAuthority}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{sub.submissionType}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(sub.targetDate)}</td>
                  <td className="px-5 py-3">
                    <ProgressBar value={sub.progress} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default Submissions;
