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

  const payload = [{
    user_id: userId,
    recipe_id: recipeId,
    created_at: new Date().toISOString(),
  }];

  const insertQuery = buildQuery({ select: 'recipe_id', on_conflict: 'user_id,recipe_id' });
  const inserted = await supabaseRequest(`/favorites${insertQuery}`, {
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=representation',
  });

  const savedRecipeId = inserted?.[0]?.recipe_id ?? inserted?.find?.(row => row?.recipe_id)?.recipe_id;
  if (!savedRecipeId) {
    // Retry fetch to confirm whether an existing row already satisfied the merge behavior
    const refreshed = await getFavorites(userId);
    if (!refreshed.includes(recipeId)) {
      const error = new Error('Favorite could not be saved');
      error.status = 500;
      throw error;
    }
    return refreshed;
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
