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
  if (params.excludeId) query.set('excludeId', params.excludeId);
  const suffix = query.toString();
  return apiRequest(`/api/users/check${suffix ? `?${suffix}` : ''}`);
}

async function fetchUserIngredientsApi(userId) {
  if (!userId) return { ingredients: [] };
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/ingredients`);
}

async function saveUserIngredientsApi(userId, items) {
  if (!userId) throw new Error('userId is required');
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/ingredients`, {
    method: 'PUT',
    body: { items },
  });
}

async function fetchFavorites(userId) {
  if (!userId) return { favorites: [] };
  return apiRequest(`/api/favorites?userId=${encodeURIComponent(userId)}`);
}

async function addFavoriteApi(userId, recipeId) {
  return apiRequest('/api/favorites', { method: 'POST', body: { userId, recipeId } });
}

async function removeFavoriteApi(userId, recipeId) {
  return apiRequest('/api/favorites', { method: 'DELETE', body: { userId, recipeId } });
}

async function updateUserApi(id, payload) {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
}

async function fetchUserApi(id) {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`);
}

function normalizeRecipeForCards(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    image: recipe.image_url,
    category: recipe.category,
    time: recipe.time,
    bookmarked: Boolean(recipe.bookmarked),
  };
}

window.apiClient = {
  apiRequest,
  fetchRecipes,
  fetchRecipeDetail,
  registerUserApi,
  loginUserApi,
  checkAvailabilityApi,
  fetchFavorites,
  addFavoriteApi,
  removeFavoriteApi,
  updateUserApi,
  fetchUserApi,
  fetchUserIngredientsApi,
  saveUserIngredientsApi,
  normalizeRecipeForCards,
};
