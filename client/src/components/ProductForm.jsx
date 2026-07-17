import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOSAGE_FORMS } from '../utils/constants';

const EMPTY = {
  productName: '',
  activeIngredient: '',
  dosageForm: '',
  strength: '',
  manufacturer: '',
  mah: '',
  atcCode: '',
};

/**
 * Reusable create/edit product form. Pass `initialValues` for edit mode.
 * `onSubmit` receives the values and should return a promise.
 */
const ProductForm = ({ initialValues, onSubmit, submitLabel = 'Save product' }) => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const setField = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.productName.trim()) next.productName = 'Product name is required';
    if (!values.activeIngredient.trim()) next.activeIngredient = 'Active ingredient is required';
    if (!values.dosageForm) next.dosageForm = 'Select a dosage form';
    if (!values.strength.trim()) next.strength = 'Strength is required';
    if (!values.manufacturer.trim()) next.manufacturer = 'Manufacturer is required';
    if (!values.mah.trim()) next.mah = 'Marketing authorisation holder is required';
    if (values.atcCode && values.atcCode.trim().length > 10) next.atcCode = 'ATC code must be 10 characters or fewer';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
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
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {field('productName', 'Product name', { placeholder: 'e.g. Amoxicillin 500mg Capsules' })}
        {field('activeIngredient', 'Active ingredient', { placeholder: 'e.g. Amoxicillin trihydrate' })}

        <div>
          <label htmlFor="dosageForm" className="label">
            Dosage form
          </label>
          <select
            id="dosageForm"
            className="input"
            value={values.dosageForm}
            onChange={setField('dosageForm')}
            aria-invalid={Boolean(errors.dosageForm)}
          >
            <option value="">Select a dosage form</option>
            {DOSAGE_FORMS.map((form) => (
              <option key={form} value={form}>
                {form.charAt(0).toUpperCase() + form.slice(1)}
              </option>
            ))}
          </select>
          {errors.dosageForm && <p className="mt-1 text-xs text-red-600">{errors.dosageForm}</p>}
        </div>

        {field('strength', 'Strength', { placeholder: 'e.g. 500 mg' })}
        {field('manufacturer', 'Manufacturer', { placeholder: 'e.g. Example Pharma Ltd' })}
        {field('mah', 'Marketing authorisation holder', { placeholder: 'e.g. Example Pharma Ltd' })}
        {field('atcCode', 'ATC code (optional)', { placeholder: 'e.g. J01CA04', maxLength: 10 })}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
