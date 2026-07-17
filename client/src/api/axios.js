import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meddossier_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected, clear it and send the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('meddossier_token');
      localStorage.removeItem('meddossier_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Convenience helper for surfacing API error messages in toasts.
export const apiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error.response && error.response.data) {
    if (error.response.data.message) return error.response.data.message;
    if (error.response.data.errors && error.response.data.errors.length) {
      return error.response.data.errors.map((e) => e.message).join('; ');
    }
  }
  return error.message || fallback;
};

export default api;
