import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import ProductDetail from './pages/ProductDetail';
import Submissions from './pages/Submissions';
import SubmissionCreate from './pages/SubmissionCreate';
import SubmissionDetail from './pages/SubmissionDetail';
import AuditLogPage from './pages/AuditLogPage';
import UserManagement from './pages/UserManagement';
import SearchResults from './pages/SearchResults';
import NotFound from './pages/NotFound';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route
      element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }
    >
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/new" element={<ProductCreate />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/products/:id/edit" element={<ProductEdit />} />
      <Route path="/submissions" element={<Submissions />} />
      <Route path="/submissions/new" element={<SubmissionCreate />} />
      <Route path="/submissions/:id" element={<SubmissionDetail />} />
      <Route path="/audit" element={<AuditLogPage />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/search" element={<SearchResults />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
