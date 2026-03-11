const rawBase = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBase(value) {
  if (!value) return '';
  return value.replace(/\/$/, '');
}

export const API_BASE_URL = normalizeBase(rawBase);

export function apiPath(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

