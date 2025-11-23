import { buildQuery, supabaseRequest } from './supabaseClient.js';

function validateUserId(userId) {
  if (!userId) {
    const error = new Error('userId is required');
    error.status = 400;
    throw error;
  }
}

async function getUserIngredients(userId) {
  validateUserId(userId);
  const query = buildQuery({
    select: 'id,ingredient,category,created_at',
    user_id: `eq.${userId}`,
    order: 'created_at.asc',
  });
  const rows = await supabaseRequest(`/user_ingredients${query}`);
  return rows.map(row => ({
    id: row.id,
    ingredient: row.ingredient,
    category: row.category,
    created_at: row.created_at,
  }));
}

async function replaceUserIngredients(userId, items = []) {
  validateUserId(userId);

  const sanitized = items
    .filter(item => item && item.ingredient)
    .map(item => ({
      user_id: userId,
      ingredient: item.ingredient,
      category: item.category || null,
    }));

  const deleteQuery = buildQuery({ user_id: `eq.${userId}` });
  await supabaseRequest(`/user_ingredients${deleteQuery}`, { method: 'DELETE' });

  if (sanitized.length > 0) {
    await supabaseRequest('/user_ingredients', {
      method: 'POST',
      body: sanitized,
      prefer: 'return=representation',
    });
  }

  return getUserIngredients(userId);
}

export { getUserIngredients, replaceUserIngredients };
