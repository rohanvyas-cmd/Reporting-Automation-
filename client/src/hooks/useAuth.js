import { useState, useEffect, useCallback } from 'react';
import { apiPath } from '../utils/api.js';
import { readJsonResponse } from '../utils/json.js';

const TOKEN_KEY = 'gtm_auth_token';
const USER_KEY = 'gtm_auth_user';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) return null;
  return token;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userRaw = sessionStorage.getItem(USER_KEY);
    if (token && userRaw && !isTokenExpired(token)) {
      try {
        setUser(JSON.parse(userRaw));
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (googleIdToken) => {
    const res = await fetch(apiPath('/auth/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: googleIdToken }),
    });

    const data = await readJsonResponse(res);

    if (!res.ok) {
      throw new Error(data.error ?? 'Sign-in failed');
    }

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut };
}
