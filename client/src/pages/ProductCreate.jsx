import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import ProductForm from '../components/ProductForm';

const ProductCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const res = await api.post('/products', values);
      toast.success('Product created');
      navigate(`/products/${res.data.product._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create product'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Add product</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new drug product master record.</p>
      </div>
      <ProductForm onSubmit={handleSubmit} submitLabel="Create product" />
    </div>
  );
};

export default ProductCreate;
