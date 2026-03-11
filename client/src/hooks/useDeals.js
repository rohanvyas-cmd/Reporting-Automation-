import { useState, useCallback } from 'react';
import { getToken } from './useAuth.js';
import { apiPath } from '../utils/api.js';

export function useDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchDeals = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = apiPath(`/api/deals${forceRefresh ? '?refresh=true' : ''}`);
      const token = getToken();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch deals');
      setDeals(data.deals ?? []);
      setFetchedAt(data.fetchedAt ? new Date(data.fetchedAt) : new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deals, loading, error, fetchedAt, fetchDeals };
}
