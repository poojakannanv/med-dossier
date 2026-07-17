import { STATUS_LABELS } from '../utils/constants';

const COLOURS = {
  'not-started': 'bg-slate-100 text-slate-600 ring-slate-300',
  draft: 'bg-amber-50 text-amber-700 ring-amber-300',
  'in-review': 'bg-blue-50 text-blue-700 ring-blue-300',
  submitted: 'bg-violet-50 text-violet-700 ring-violet-300',
  approved: 'bg-green-50 text-green-700 ring-green-300',
  rejected: 'bg-red-50 text-red-700 ring-red-300',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
      COLOURS[status] || COLOURS['not-started']
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
