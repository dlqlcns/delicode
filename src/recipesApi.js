import { supabaseRequest, buildQuery } from './supabaseClient.js';

function normalizeRecipe(record) {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    description: record.description,
    time: record.time,
    image_url: record.image_url,
  };
}

async function fetchRecipeIdsByIngredients(terms) {
  if (!terms.length) return [];
  const orFilter = terms.map(term => `ingredient.ilike.%${term}%`).join(',');
  const query = buildQuery({ select: 'recipe_id', or: `(${orFilter})` });
  const data = await supabaseRequest(`/recipe_ingredients${query}`);
  const ids = new Set();
  data.forEach(row => ids.add(row.recipe_id));
  return [...ids];
}

async function getRecipes(params) {
  const { search, category, ingredients, limit } = params;
  const searchParams = { select: 'id,name,category,description,time,image_url' };

  if (category) {
    searchParams.category = `eq.${category}`;
  }

  if (search) {
    searchParams.or = `(name.ilike.%${search}%,description.ilike.%${search}%)`;
  }

  if (limit) {
    searchParams.limit = limit;
  }

  let ingredientIds = [];
  if (ingredients?.length) {
    ingredientIds = await fetchRecipeIdsByIngredients(ingredients);
    if (ingredientIds.length === 0) return [];
    searchParams.id = `in.(${ingredientIds.join(',')})`;
  }

  const query = buildQuery(searchParams);
  const data = await supabaseRequest(`/recipes${query}`);
  return data.map(normalizeRecipe);
}

async function getRecipeDetail(id) {
  const detailQuery = buildQuery({
    select: 'id,name,category,description,time,image_url',
    id: `eq.${id}`,
  });
  const recipes = await supabaseRequest(`/recipes${detailQuery}`);
  const recipe = recipes[0];
  if (!recipe) return null;

  const [ingredients, steps] = await Promise.all([
    supabaseRequest(`/recipe_ingredients${buildQuery({
      select: 'ingredient,amount,unit',
      recipe_id: `eq.${id}`,
      order: 'id.asc',
    })}`),
    supabaseRequest(`/recipe_steps${buildQuery({
      select: 'step_order,step_description',
      recipe_id: `eq.${id}`,
      order: 'step_order.asc',
    })}`),
  ]);

  return {
    ...normalizeRecipe(recipe),
    ingredients: ingredients || [],
    steps: steps || [],
  };
}

export { getRecipes, getRecipeDetail };
