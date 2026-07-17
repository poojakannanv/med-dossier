import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import ActivityFeed from '../components/ActivityFeed';
import { SkeletonCard } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/format';

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2.5">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="text-right text-sm font-medium text-slate-700">{value || 'N/A'}</dd>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load product'));
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      navigate('/products');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete product'));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/products" className="text-sm text-brand-600 hover:text-brand-700">
            Back to products
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">{product.productName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {product.activeIngredient} · <span className="capitalize">{product.dosageForm}</span> · {product.strength}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <Link to={`/products/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button type="button" className="btn-danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">Product details</h2>
          <dl className="mt-3 divide-y divide-slate-100">
            <DetailRow label="Product name" value={product.productName} />
            <DetailRow label="Active ingredient" value={product.activeIngredient} />
            <DetailRow label="Dosage form" value={<span className="capitalize">{product.dosageForm}</span>} />
            <DetailRow label="Strength" value={product.strength} />
            <DetailRow label="Manufacturer" value={product.manufacturer} />
            <DetailRow label="Marketing authorisation holder" value={product.mah} />
            <DetailRow label="ATC code" value={product.atcCode} />
            <DetailRow label="Created by" value={product.createdBy ? product.createdBy.name : 'N/A'} />
            <DetailRow label="Created on" value={formatDate(product.createdAt)} />
            <DetailRow label="Last updated" value={formatDate(product.updatedAt)} />
          </dl>
        </div>

        <ActivityFeed entityType="product" entityId={id} title="Product activity" />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this product?"
        message={`"${product.productName}" will be permanently removed. Products with linked submissions cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        busy={deleting}
      />
    </div>
  );
};

export default ProductDetail;
