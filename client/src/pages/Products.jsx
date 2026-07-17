import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { DOSAGE_FORMS } from '../utils/constants';
import { formatDate } from '../utils/format';

const Products = () => {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (dosageForm) params.dosageForm = dosageForm;
        const res = await api.get('/products', { params });
        if (active) setData(res.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load products'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [search, dosageForm, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleFilter = (e) => {
    setPage(1);
    setDosageForm(e.target.value);
  };

  const hasFilters = search || dosageForm;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Drug products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.total} product{data.total === 1 ? '' : 's'} in the master record
          </p>
        </div>
        {canEdit && (
          <Link to="/products/new" className="btn-primary">
            Add product
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
          <label htmlFor="product-search" className="sr-only">
            Search products by name
          </label>
          <input
            id="product-search"
            type="search"
            className="input max-w-xs"
            placeholder="Search by product name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <div>
          <label htmlFor="dosage-filter" className="sr-only">
            Filter by dosage form
          </label>
          <select id="dosage-filter" className="input w-48" value={dosageForm} onChange={handleFilter}>
            <option value="">All dosage forms</option>
            {DOSAGE_FORMS.map((form) => (
              <option key={form} value={form}>
                {form.charAt(0).toUpperCase() + form.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : data.products.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching products' : 'No products yet'}
          message={
            hasFilters
              ? 'Try a different search term or clear the dosage form filter.'
              : 'Add your first drug product to start building submission dossiers.'
          }
          actionLabel={canEdit && !hasFilters ? 'Add product' : undefined}
          actionTo={canEdit && !hasFilters ? '/products/new' : undefined}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Product name</th>
                <th className="px-5 py-3">Active ingredient</th>
                <th className="px-5 py-3">Dosage form</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3">Manufacturer</th>
                <th className="px-5 py-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.products.map((product) => (
                <tr
                  key={product._id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <td className="px-5 py-3 font-medium text-brand-600">{product.productName}</td>
                  <td className="px-5 py-3 text-slate-600">{product.activeIngredient}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{product.dosageForm}</td>
                  <td className="px-5 py-3 text-slate-600">{product.strength}</td>
                  <td className="px-5 py-3 text-slate-600">{product.manufacturer}</td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(product.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
};

export default Products;
