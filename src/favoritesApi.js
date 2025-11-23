import { buildQuery, supabaseRequest } from './supabaseClient.js';

async function getFavorites(userId) {
  if (!userId) {
    const error = new Error('userId is required');
    error.status = 400;
    throw error;
  }

  const query = buildQuery({ select: 'recipe_id', user_id: `eq.${userId}` });
  const rows = await supabaseRequest(`/favorites${query}`);
  return rows.map(row => row.recipe_id);
}

async function addFavorite(userId, recipeId) {
  if (!userId || !recipeId) {
    const error = new Error('userId and recipeId are required');
    error.status = 400;
    throw error;
  }

  await supabaseRequest('/favorites', {
    method: 'POST',
    body: [{ user_id: userId, recipe_id: recipeId }],
    prefer: 'return=representation,resolution=merge-duplicates',
  });

  return getFavorites(userId);
}

async function removeFavorite(userId, recipeId) {
  if (!userId || !recipeId) {
    const error = new Error('userId and recipeId are required');
    error.status = 400;
    throw error;
  }

  const query = buildQuery({ user_id: `eq.${userId}`, recipe_id: `eq.${recipeId}` });
  await supabaseRequest(`/favorites${query}`, { method: 'DELETE' });
  return getFavorites(userId);
}

export { getFavorites, addFavorite, removeFavorite };
