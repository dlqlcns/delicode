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

async function upsertSocialUserApi(payload) {
  return apiRequest('/api/users/social-register', { method: 'POST', body: payload });
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

const FAVORITES_PREFIX = 'favorites_user_';
const inMemoryFavorites = new Map();

function normalizeIds(ids) {
  return Array.from(new Set(ids.map(id => Number(id)).filter(Number.isFinite)));
}

function readFavorites(userId) {
  if (!userId) return [];
  const key = `${FAVORITES_PREFIX}${userId}`;

  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(list) ? normalizeIds(list) : [];
    inMemoryFavorites.set(userId, normalized);
    return normalized;
  } catch (err) {
    console.warn('즐겨찾기 목록을 불러오지 못했습니다. 로컬 스토리지 대신 메모리 저장소를 사용합니다.', err);
    const fallback = inMemoryFavorites.get(userId) || [];
    return normalizeIds(fallback);
  }
}

function writeFavorites(userId, ids) {
  if (!userId) return [];
  const key = `${FAVORITES_PREFIX}${userId}`;
  const normalized = normalizeIds(ids);
  inMemoryFavorites.set(userId, normalized);

  try {
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch (err) {
    console.warn('로컬 스토리지에 즐겨찾기를 저장할 수 없습니다. 세션 동안 메모리에 저장합니다.', err);
  }

  return normalized;
}

async function fetchFavorites(userId) {
  if (!userId) return { favorites: [] };

  try {
    const query = new URLSearchParams({ userId });
    const response = await apiRequest(`/api/favorites?${query.toString()}`);
    const favorites = writeFavorites(userId, response.favorites || []);
    return { favorites };
  } catch (err) {
    console.warn('즐겨찾기 정보를 서버에서 불러오지 못했습니다. 로컬 저장 데이터를 사용합니다.', err);
    return { favorites: readFavorites(userId) };
  }
}

async function addFavoriteApi(userId, recipeId) {
  if (!userId || !recipeId) throw new Error('userId와 recipeId가 필요합니다.');

  const response = await apiRequest('/api/favorites', {
    method: 'POST',
    body: { userId, recipeId },
  });

  const favorites = writeFavorites(userId, response.favorites || []);
  return { favorites };
}

async function removeFavoriteApi(userId, recipeId) {
  if (!userId || !recipeId) throw new Error('userId와 recipeId가 필요합니다.');

  const response = await apiRequest('/api/favorites', {
    method: 'DELETE',
    body: { userId, recipeId },
  });

  const favorites = writeFavorites(userId, response.favorites || []);
  return { favorites };
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
  upsertSocialUserApi,
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
