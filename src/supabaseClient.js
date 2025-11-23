import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in the environment.');
}

const REST_URL = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

const defaultHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function supabaseRequest(path, { method = 'GET', body, headers = {}, prefer } = {}) {
  const requestHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (prefer) {
    requestHeaders.Prefer = prefer;
  }

  const response = await fetch(`${REST_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Supabase request failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

function generateId() {
  return randomUUID();
}

export { supabaseRequest, buildQuery, generateId };
