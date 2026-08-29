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

api.interceptors.request.use((config) => {
  const user = auth.currentUser;
  if (user) {
    config.headers['x-user-id'] = user.uid;
    
    // Collect all identifiers for collaboration
    const identifiers = new Set<string>();
    if (user.email) identifiers.add(user.email.toLowerCase());
    if (user.displayName) identifiers.add(user.displayName.toLowerCase().replace(/\s/g, ''));
    
    // Check provider data (e.g. GitHub username usually maps to screenName or email)
    user.providerData.forEach(profile => {
      if (profile.email) identifiers.add(profile.email.toLowerCase());
      if (profile.displayName) identifiers.add(profile.displayName.toLowerCase().replace(/\s/g, ''));
    });
    
    // Sometimes github username is in reloadUserInfo
    const reloadUserInfo = (user as any).reloadUserInfo;
    if (reloadUserInfo && reloadUserInfo.screenName) {
       identifiers.add(reloadUserInfo.screenName.toLowerCase());
    }

    config.headers['x-user-identifiers'] = Array.from(identifiers).join(',');
    config.headers['x-user-name'] = user.displayName || user.email?.split('@')[0] || 'Unknown User';
  }
  return config;
});
