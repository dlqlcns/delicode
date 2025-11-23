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

  // Clear any existing rows for this user/recipe pair before inserting so the
  // insert never fails due to missing constraints while still keeping the
  // table deduplicated.
  await removeFavorite(userId, recipeId);

  const insertQuery = buildQuery({ select: 'recipe_id' });
  const inserted = await supabaseRequest(`/favorites${insertQuery}`, {
    method: 'POST',
    body: [{ user_id: userId, recipe_id: recipeId, created_at: new Date().toISOString() }],
    prefer: 'return=representation',
  });

  if (!Array.isArray(inserted) || inserted.length === 0 || !inserted.some(row => row.recipe_id === recipeId)) {
    const error = new Error('Favorite could not be saved');
    error.status = 500;
    throw error;
  }

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
