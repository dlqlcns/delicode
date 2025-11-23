import { buildQuery, supabaseRequest } from './supabaseClient.js';

function toNumber(value, field) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return num;
}

function parseSupabaseError(error) {
  const friendly = new Error(error?.message || 'Supabase request failed');
  friendly.status = error?.status || 500;
  return friendly;
}

async function getFavorites(userId) {
  const uid = toNumber(userId, 'userId');
  const query = buildQuery({ select: 'recipe_id', user_id: `eq.${uid}` });
  try {
    const rows = await supabaseRequest(`/favorites${query}`);
    return (rows || []).map(row => row.recipe_id);
  } catch (err) {
    throw parseSupabaseError(err);
  }
}

async function addFavorite(userId, recipeId) {
  const uid = toNumber(userId, 'userId');
  const rid = toNumber(recipeId, 'recipeId');

  const conflictQuery = buildQuery({
    on_conflict: 'user_id,recipe_id',
    select: 'id,recipe_id,user_id',
  });

  try {
    const inserted = await supabaseRequest(`/favorites${conflictQuery}`, {
      method: 'POST',
      body: {
        user_id: uid,
        recipe_id: rid,
        created_at: new Date().toISOString(),
      },
      prefer: 'resolution=merge-duplicates,return=representation',
    });

    const savedRecipeId = Array.isArray(inserted) ? inserted[0]?.recipe_id : inserted?.recipe_id;
    if (!savedRecipeId) {
      // Fallback select in case representation is empty for duplicates
      const validationQuery = buildQuery({
        select: 'recipe_id',
        user_id: `eq.${uid}`,
        recipe_id: `eq.${rid}`,
        limit: 1,
      });
      const rows = await supabaseRequest(`/favorites${validationQuery}`);
      if (!rows?.length) {
        const error = new Error('Favorite could not be saved');
        error.status = 500;
        throw error;
      }
    }

    return getFavorites(uid);
  } catch (err) {
    throw parseSupabaseError(err);
  }
}

async function removeFavorite(userId, recipeId) {
  const uid = toNumber(userId, 'userId');
  const rid = toNumber(recipeId, 'recipeId');
  const deleteQuery = buildQuery({ user_id: `eq.${uid}`, recipe_id: `eq.${rid}` });

  try {
    await supabaseRequest(`/favorites${deleteQuery}`, { method: 'DELETE' });
    return getFavorites(uid);
  } catch (err) {
    throw parseSupabaseError(err);
  }
}

export { getFavorites, addFavorite, removeFavorite };
