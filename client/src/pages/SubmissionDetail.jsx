import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import ConfirmModal from '../components/ConfirmModal';
import ActivityFeed from '../components/ActivityFeed';
import { SkeletonCard } from '../components/LoadingSkeleton';
import { MODULE_STATUSES, SUBMISSION_STATUSES, STATUS_LABELS } from '../utils/constants';
import { formatDate, formatDateTime, formatFileSize } from '../utils/format';

// Triggers a browser download from an authenticated endpoint.
const downloadBlob = async (url, fallbackName) => {
  const res = await api.get(url, { responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const ModuleCard = ({ submissionId, module, users, canAssign, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleStatusChange = async (e) => {
    try {
      const res = await api.patch(`/submissions/${submissionId}/modules/${module._id}/status`, {
        status: e.target.value,
      });
      toast.success(`Module ${module.code} updated`);
      onUpdated(res.data.submission);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update module status'));
    }
  };

  const handleOwnerChange = async (e) => {
    try {
      const res = await api.patch(`/submissions/${submissionId}/modules/${module._id}/owner`, {
        ownerId: e.target.value || null,
      });
      toast.success(e.target.value ? 'Owner assigned' : 'Owner removed');
      onUpdated(res.data.submission);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not assign owner'));
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(
        `/submissions/${submissionId}/modules/${module._id}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(`"${file.name}" uploaded to ${module.code}`);
      onUpdated(res.data.submission);
      setExpanded(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc) => {
    try {
      await downloadBlob(
        `/submissions/${submissionId}/modules/${module._id}/documents/${doc._id}/download`,
        doc.originalName
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Download failed'));
    }
  };

  const handleMarkCurrent = async (doc) => {
    try {
      const res = await api.patch(
        `/submissions/${submissionId}/modules/${module._id}/documents/${doc._id}/current`
      );
      toast.success(`Version ${doc.version} is now current`);
      onUpdated(res.data.submission);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update current version'));
    }
  };

  const sortedDocs = [...(module.documents || [])].sort((a, b) => b.version - a.version);
  const currentDoc = sortedDocs.find((d) => d.isCurrent);

  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{module.code}</p>
          <p className="truncate text-xs text-slate-500">{module.title}</p>
        </div>

        <div>
          <label htmlFor={`status-${module._id}`} className="sr-only">
            Status for module {module.code}
          </label>
          <select
            id={`status-${module._id}`}
            className="input w-36 py-1.5 text-xs"
            value={module.status}
            onChange={handleStatusChange}
          >
            {MODULE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`owner-${module._id}`} className="sr-only">
            Owner for module {module.code}
          </label>
          <select
            id={`owner-${module._id}`}
            className="input w-40 py-1.5 text-xs"
            value={module.owner ? module.owner._id : ''}
            onChange={handleOwnerChange}
            disabled={!canAssign}
            title={canAssign ? 'Assign an owner' : 'Only regulatory and admin users can assign owners'}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <label className="btn-secondary cursor-pointer text-xs" aria-disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
            aria-label={`Upload document to module ${module.code}`}
          />
        </label>

        <button
          type="button"
          className="btn-secondary px-3 text-xs"
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
        >
          {sortedDocs.length} version{sortedDocs.length === 1 ? '' : 's'} {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-50 px-5 py-4">
          {sortedDocs.length === 0 ? (
            <p className="text-sm text-slate-500">
              No documents uploaded yet. Upload the first version of this module document.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedDocs.map((doc) => (
                <li
                  key={doc._id}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                    doc.isCurrent ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    v{doc.version}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{doc.originalName}</span>
                  {doc.isCurrent && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Current
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {formatFileSize(doc.size)} · {doc.uploadedBy ? doc.uploadedBy.name : 'Unknown'} ·{' '}
                    {formatDateTime(doc.uploadedAt)}
                  </span>
                  <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => handleDownload(doc)}>
                    Download
                  </button>
                  {!doc.isCurrent && (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                      onClick={() => handleMarkCurrent(doc)}
                    >
                      Mark current
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {currentDoc && (
            <p className="mt-3 text-xs text-slate-400">
              Current version: v{currentDoc.version} ({currentDoc.originalName})
            </p>
          )}
        </div>
      )}
    </li>
  );
};

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, usersRes] = await Promise.all([
          api.get(`/submissions/${id}`),
          api.get('/users/assignable'),
        ]);
        setSubmission(subRes.data.submission);
        setUsers(usersRes.data.users);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load submission'));
        navigate('/submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleUpdated = (next) => {
    // Module/document endpoints return the refreshed submission.
    setSubmission((prev) => ({ ...prev, ...next, progress: next.progress !== undefined ? next.progress : computeProgress(next) }));
    setFeedKey((k) => k + 1);
  };

  const computeProgress = (sub) => {
    if (!sub.modules || sub.modules.length === 0) return 0;
    const approved = sub.modules.filter((m) => m.status === 'approved').length;
    return Math.round((approved / sub.modules.length) * 100);
  };

  const handleStatusChange = async (e) => {
    try {
      const res = await api.put(`/submissions/${id}`, { status: e.target.value });
      toast.success('Submission status updated');
      handleUpdated(res.data.submission);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update status'));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/submissions/${id}`);
      toast.success('Submission deleted');
      navigate('/submissions');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete submission'));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadBlob(`/submissions/${id}/export`, 'submission-summary.pdf');
      toast.success('PDF exported');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (!submission) return null;

  const productName = submission.productId ? submission.productId.productName : 'Unknown product';
  const progress = submission.progress !== undefined ? submission.progress : computeProgress(submission);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/submissions" className="text-sm text-brand-600 hover:text-brand-700">
            Back to submissions
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">{productName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {submission.regulatoryAuthority} · <span className="capitalize">{submission.submissionType}</span> · target{' '}
            {formatDate(submission.targetDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <div>
              <label htmlFor="submission-status" className="sr-only">
                Submission status
              </label>
              <select id="submission-status" className="input w-40" value={submission.status} onChange={handleStatusChange}>
                {SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <StatusBadge status={submission.status} />
          )}
          <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          {canEdit && (
            <button type="button" className="btn-danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-800">Overall progress</h2>
          <span className="text-xs text-slate-400">Based on approved modules</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">CTD module checklist (3.2.P)</h2>
          <span className="text-xs text-slate-400">{submission.modules.length} modules</span>
        </div>
        <ul>
          {submission.modules.map((module) => (
            <ModuleCard
              key={module._id}
              submissionId={id}
              module={module}
              users={users}
              canAssign={canEdit}
              onUpdated={handleUpdated}
            />
          ))}
        </ul>
      </div>

      <ActivityFeed entityType="submission" entityId={id} title="Submission activity" refreshKey={feedKey} />

      <ConfirmModal
        open={confirmOpen}
        title="Delete this submission?"
        message={`The ${submission.regulatoryAuthority} submission for "${productName}" and its module checklist will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        busy={deleting}
      />
    </div>
  );
};

export default SubmissionDetail;
