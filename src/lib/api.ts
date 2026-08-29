import axios from 'axios';

// Get the backend URL from environment variables, fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Pre-configured Axios instance for making API requests to the Render backend.
 * Automatically includes the correct base URL and standard headers.
 */
export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: You can add interceptors here later to automatically attach Firebase Auth tokens
// api.interceptors.request.use(async (config) => {
//   const token = await getFirebaseAuthToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });
