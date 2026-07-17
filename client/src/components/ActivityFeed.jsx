import { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatDateTime } from '../utils/format';
import { SkeletonLine } from './LoadingSkeleton';

const ACTION_COLOURS = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  upload: 'bg-violet-500',
  download: 'bg-slate-400',
  login: 'bg-slate-400',
  register: 'bg-green-500',
};

/**
 * Recent activity list backed by the audit log.
 * Pass entityType/entityId to scope it to one record (e.g. one submission),
 * or leave both off for a global feed.
 */
const ActivityFeed = ({ entityType, entityId, limit = 8, title = 'Recent activity', refreshKey = 0 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit };
        if (entityType) params.entityType = entityType;
        if (entityId) params.entityId = entityId;
        const res = await api.get('/audit/recent', { params });
        if (active) setLogs(res.data.logs);
      } catch {
        if (active) setLogs([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [entityType, entityId, limit, refreshKey]);

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonLine />
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-5/6" />
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No activity recorded yet. Changes will appear here as your team works.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {logs.map((log) => (
            <li key={log._id} className="flex gap-3">
              <span
                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${ACTION_COLOURS[log.action] || 'bg-slate-400'}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm text-slate-700">
                  {log.summary || `${log.action} on ${log.entityType}`}
                </p>
                <p className="text-xs text-slate-400">
                  {log.userId && log.userId.name ? `${log.userId.name} · ` : ''}
                  {formatDateTime(log.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;
