import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { formatDateTime } from '../utils/format';

const ENTITY_TYPES = ['user', 'product', 'submission', 'module', 'document'];
const ACTIONS = ['create', 'update', 'delete', 'upload', 'download', 'login', 'register'];

const ACTION_COLOURS = {
  create: 'bg-green-50 text-green-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  upload: 'bg-violet-50 text-violet-700',
  download: 'bg-slate-100 text-slate-600',
  login: 'bg-slate-100 text-slate-600',
  register: 'bg-green-50 text-green-700',
};

const AuditLogPage = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ logs: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (entityType) params.entityType = entityType;
        if (action) params.action = action;
        const res = await api.get('/audit', { params });
        if (active) setData(res.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load audit log'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isAdmin, entityType, action, page]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every create, update, delete and upload across the platform. {data.total} entries.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="entity-filter" className="sr-only">
            Filter by entity type
          </label>
          <select
            id="entity-filter"
            className="input w-44"
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="action-filter" className="sr-only">
            Filter by action
          </label>
          <select
            id="action-filter"
            className="input w-44"
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : data.logs.length === 0 ? (
        <EmptyState
          title="No audit entries"
          message="No activity matches these filters yet. Entries appear as your team works."
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Summary</th>
                <th className="px-5 py-3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.logs.map((log) => (
                <tr key={log._id} className="align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(log.timestamp)}</td>
                  <td className="px-5 py-3 text-slate-700">{log.userId ? log.userId.name : 'System'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOURS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">{log.entityType}</td>
                  <td className="max-w-xs px-5 py-3 text-slate-600">{log.summary || 'N/A'}</td>
                  <td className="px-5 py-3">
                    {log.changes && (log.changes.before || log.changes.after) ? (
                      <>
                        <button
                          type="button"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                        >
                          {expandedId === log._id ? 'Hide' : 'View'}
                        </button>
                        {expandedId === log._id && (
                          <pre className="mt-2 max-h-48 max-w-xs overflow-auto rounded bg-slate-800 p-3 text-xs text-slate-100">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
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

export default AuditLogPage;
