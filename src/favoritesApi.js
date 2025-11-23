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

  // Use an upsert to guarantee one favorite row per user/recipe pair and make
  // sure created_at is populated for visibility in the DB console.
  const upsertQuery = buildQuery({ on_conflict: 'user_id,recipe_id' });
  const inserted = await supabaseRequest(`/favorites${upsertQuery}`, {
    method: 'POST',
    body: [{ user_id: userId, recipe_id: recipeId, created_at: new Date().toISOString() }],
    prefer: 'return=representation,resolution=merge-duplicates',
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
