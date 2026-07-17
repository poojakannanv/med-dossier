import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/format';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'regulatory' };

const UserManagement = () => {
  const { isAdmin, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success('User created. A welcome email has been sent if SMTP is configured.');
      setForm(EMPTY_FORM);
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create user'));
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change role'));
    }
  };

  const handleToggleActive = async (target) => {
    try {
      await api.patch(`/users/${target._id}/status`, { isActive: !target.isActive });
      toast.success(target.isActive ? `${target.name} deactivated` : `${target.name} reactivated`);
      setPendingDeactivate(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update user status'));
      setPendingDeactivate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">User management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {users.length} user{users.length === 1 ? '' : 's'} on this instance
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormOpen((o) => !o)}>
          {formOpen ? 'Close form' : 'Create user'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="card max-w-2xl space-y-4" noValidate>
          <h2 className="text-base font-semibold text-slate-800">New user</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-name" className="label">
                Full name
              </label>
              <input id="new-name" className="input" value={form.name} onChange={setField('name')} />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="new-email" className="label">
                Email address
              </label>
              <input id="new-email" type="email" className="input" value={form.email} onChange={setField('email')} />
              {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="new-password" className="label">
                Temporary password
              </label>
              <input
                id="new-password"
                type="password"
                className="input"
                value={form.password}
                onChange={setField('password')}
                autoComplete="new-password"
              />
              {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="new-role" className="label">
                Role
              </label>
              <select id="new-role" className="input" value={form.role} onChange={setField('role')}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = me && u._id === me._id;
                return (
                  <tr key={u._id} className={u.isActive ? '' : 'opacity-60'}>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <label htmlFor={`role-${u._id}`} className="sr-only">
                        Role for {u.name}
                      </label>
                      <select
                        id={`role-${u._id}`}
                        className="input w-44 py-1.5 text-xs"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={isSelf}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      {!isSelf &&
                        (u.isActive ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                            onClick={() => setPendingDeactivate(u)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                            onClick={() => handleToggleActive(u)}
                          >
                            Reactivate
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDeactivate)}
        title="Deactivate this user?"
        message={
          pendingDeactivate
            ? `${pendingDeactivate.name} will no longer be able to sign in. Their history and assignments are preserved.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={() => handleToggleActive(pendingDeactivate)}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
};

export default UserManagement;
