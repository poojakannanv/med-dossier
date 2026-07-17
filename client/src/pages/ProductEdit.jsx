import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import ProductForm from '../components/ProductForm';
import { SkeletonCard } from '../components/LoadingSkeleton';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (values) => {
    try {
      await api.put(`/products/${id}`, values);
      toast.success('Product updated');
      navigate(`/products/${id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update product'));
    }
  };

  if (loading) return <SkeletonCard />;
  if (!product) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Edit product</h1>
        <p className="mt-1 text-sm text-slate-500">Update the master record for {product.productName}.</p>
      </div>
      <ProductForm
        initialValues={{
          productName: product.productName,
          activeIngredient: product.activeIngredient,
          dosageForm: product.dosageForm,
          strength: product.strength,
          manufacturer: product.manufacturer,
          mah: product.mah,
          atcCode: product.atcCode || '',
        }}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
};

export default ProductEdit;
