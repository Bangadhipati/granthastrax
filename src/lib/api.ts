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

import { auth } from './firebase';

// Add interceptor to automatically attach the Firebase Auth user ID
api.interceptors.request.use((config) => {
  const user = auth.currentUser;
  if (user) {
    config.headers['x-user-id'] = user.uid;
  }
  return config;
});
