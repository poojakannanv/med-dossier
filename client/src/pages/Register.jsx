import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/axios';
import { ROLES, ROLE_LABELS } from '../utils/constants';

const Register = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'regulatory',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const setField = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address';
    if (values.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      });
      toast.success('Account created. Welcome to MedDossier.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, type = 'text', props = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        type={type}
        className="input"
        value={values[name]}
        onChange={setField(name)}
        aria-invalid={Boolean(errors[name])}
        {...props}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            MD
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join your team on MedDossier</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
          {field('name', 'Full name', 'text', { autoComplete: 'name', placeholder: 'e.g. Asha Patel' })}
          {field('email', 'Email address', 'email', { autoComplete: 'email', placeholder: 'you@company.com' })}

          <div>
            <label htmlFor="role" className="label">
              Role
            </label>
            <select id="role" className="input" value={values.role} onChange={setField('role')}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {field('password', 'Password', 'password', { autoComplete: 'new-password', placeholder: 'At least 8 characters' })}
          {field('confirmPassword', 'Confirm password', 'password', { autoComplete: 'new-password', placeholder: 'Repeat your password' })}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
