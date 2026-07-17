import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ActivityFeed from '../components/ActivityFeed';
import StatusBadge from '../components/StatusBadge';
import { SkeletonStats, SkeletonCard } from '../components/LoadingSkeleton';
import { formatDate, daysUntil } from '../utils/format';
import { STATUS_LABELS } from '../utils/constants';

const STATUS_COLOURS = {
  draft: '#f59e0b',
  'in-review': '#3b82f6',
  submitted: '#8b5cf6',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ label, value, to }) => (
  <Link to={to} className="card block transition hover:shadow-md">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-800">{value}</p>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load dashboard'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={2} />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Dashboard data is unavailable. Try refreshing the page.</p>;
  }

  const pieData = data.byStatus.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    colour: STATUS_COLOURS[s.status] || '#94a3b8',
  }));

  const barData = data.byMonth.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} ${String(m.year).slice(2)}`,
    submissions: m.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hello {user ? user.name.split(' ')[0] : ''}, here is the state of your dossiers today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Drug products" value={data.totals.products} to="/products" />
        <StatCard label="Active submissions" value={data.totals.activeSubmissions} to="/submissions" />
        <StatCard
          label="Deadlines in 30 days"
          value={data.upcomingDeadlines.length}
          to="/submissions"
        />
        <StatCard
          label="Approved submissions"
          value={(data.byStatus.find((s) => s.status === 'approved') || { count: 0 }).count}
          to="/submissions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">Submissions by status</h2>
          {pieData.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No submissions yet. Create one to see the breakdown.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={85} label>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.colour} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">Submissions by month</h2>
          {barData.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No submissions yet. Activity by month will appear here.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#1b6ef5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">Upcoming deadlines (next 30 days)</h2>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nothing due in the next 30 days. Enjoy the calm.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.upcomingDeadlines.map((sub) => {
                const days = daysUntil(sub.targetDate);
                return (
                  <li key={sub._id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link to={`/submissions/${sub._id}`} className="truncate text-sm font-medium text-brand-600 hover:text-brand-700">
                        {sub.productId ? sub.productId.productName : 'Unknown product'}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {sub.regulatoryAuthority} · {sub.submissionType} · due {formatDate(sub.targetDate)}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-slate-500'}`}>
                        {days} day{days === 1 ? '' : 's'}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ActivityFeed limit={8} />
      </div>
    </div>
  );
};

export default Dashboard;
