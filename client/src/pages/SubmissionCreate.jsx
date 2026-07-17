import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { AUTHORITIES, SUBMISSION_TYPES } from '../utils/constants';

const SubmissionCreate = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [values, setValues] = useState({
    productId: '',
    regulatoryAuthority: 'MHRA',
    submissionType: 'new',
    targetDate: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products', { params: { limit: 100 } });
        setProducts(res.data.products);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load products'));
      }
    };
    load();
  }, []);

  const setField = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.productId) next.productId = 'Select a product';
    if (!values.targetDate) next.targetDate = 'Choose a target date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await api.post('/submissions', values);
      toast.success('Submission created with the full CTD module checklist');
      navigate(`/submissions/${res.data.submission._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create submission'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">New submission</h1>
        <p className="mt-1 text-sm text-slate-500">
          The CTD Module 3.2.P checklist is created automatically for every new submission.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5" noValidate>
        <div>
          <label htmlFor="productId" className="label">
            Drug product
          </label>
          <select
            id="productId"
            className="input"
            value={values.productId}
            onChange={setField('productId')}
            aria-invalid={Boolean(errors.productId)}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.productName} ({p.strength})
              </option>
            ))}
          </select>
          {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId}</p>}
          {products.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">No products found. Add a product first.</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="regulatoryAuthority" className="label">
              Regulatory authority
            </label>
            <select
              id="regulatoryAuthority"
              className="input"
              value={values.regulatoryAuthority}
              onChange={setField('regulatoryAuthority')}
            >
              {AUTHORITIES.map((a) => (
                <option key={a} value={a}>
                  {a === 'other' ? 'Other' : a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="submissionType" className="label">
              Submission type
            </label>
            <select
              id="submissionType"
              className="input"
              value={values.submissionType}
              onChange={setField('submissionType')}
            >
              {SUBMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="targetDate" className="label">
            Target submission date
          </label>
          <input
            id="targetDate"
            type="date"
            className="input max-w-xs"
            value={values.targetDate}
            onChange={setField('targetDate')}
            aria-invalid={Boolean(errors.targetDate)}
          />
          {errors.targetDate && <p className="mt-1 text-xs text-red-600">{errors.targetDate}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate('/submissions')} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Creating...' : 'Create submission'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionCreate;
