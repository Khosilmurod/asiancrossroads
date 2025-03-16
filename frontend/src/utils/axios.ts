import axios from 'axios';

// Set base URL for all requests
axios.defaults.baseURL = 'http://localhost:8000';

// Add a request interceptor to add the auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios; 