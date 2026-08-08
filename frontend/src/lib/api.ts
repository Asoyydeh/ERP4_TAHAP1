import axios from 'axios';

export const getBackendHostUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://127.0.0.1:5000';
};

export const getApiBaseUrl = (): string => {
  return `${getBackendHostUrl()}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyisipkan token JWT & memastikan Host URL Backend selalu melalui proxy Next.js / API
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const baseUrl = getApiBaseUrl();
      if (config.url && !config.url.startsWith('http')) {
        const cleanPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
        config.url = `${baseUrl}${cleanPath}`;
        config.baseURL = '';
      } else {
        config.baseURL = baseUrl;
      }
    }
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirectingToLogin = false;

// Interceptor untuk menangani error unauthorized dan broadcast perubahan data real-time
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined' && ['post', 'put', 'delete', 'patch'].includes((response.config.method || '').toLowerCase())) {
      try {
        window.dispatchEvent(new CustomEvent('app_data_changed'));
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('app_data_sync');
          channel.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
          channel.close();
        }
      } catch (e) {
        // Ignore broadcast errors
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('auth_logout'));
        if (!isRedirectingToLogin && window.location.pathname !== '/login') {
          isRedirectingToLogin = true;
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
