const API_BASE = '';

async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.error || payload?.message || payload || 'Request failed';
    throw new Error(message);
  }
  return payload;
}

async function fetchRecipes(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const suffix = query.toString();
  return apiRequest(`/api/recipes${suffix ? `?${suffix}` : ''}`);
}

async function fetchRecipeDetail(id) {
  return apiRequest(`/api/recipes/${encodeURIComponent(id)}`);
}

async function registerUserApi(payload) {
  return apiRequest('/api/users/register', { method: 'POST', body: payload });
}

async function loginUserApi(payload) {
  return apiRequest('/api/users/login', { method: 'POST', body: payload });
}

async function checkAvailabilityApi(params = {}) {
  const query = new URLSearchParams();
  if (params.username) query.set('username', params.username);
  if (params.email) query.set('email', params.email);
  const suffix = query.toString();
  return apiRequest(`/api/users/check${suffix ? `?${suffix}` : ''}`);
}

function normalizeRecipeForCards(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    image: recipe.image_url,
    category: recipe.category,
    time: recipe.time,
    bookmarked: false,
  };
}

window.apiClient = {
  apiRequest,
  fetchRecipes,
  fetchRecipeDetail,
  registerUserApi,
  loginUserApi,
  checkAvailabilityApi,
  normalizeRecipeForCards,
};
