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
  const normalizedTerms = terms?.map(term => term.trim()).filter(Boolean) ?? [];
  if (!normalizedTerms.length) return [];

  const orFilter = normalizedTerms.map(term => `ingredient.ilike.%${term}%`).join(',');
  const query = buildQuery({ select: 'recipe_id,ingredient', or: `(${orFilter})` });
  const data = await supabaseRequest(`/recipe_ingredients${query}`);

  const matchesByRecipe = new Map();

  data.forEach(row => {
    const ingredient = row.ingredient?.toLowerCase?.() ?? '';
    const matchedTerms = matchesByRecipe.get(row.recipe_id) ?? new Set();

    normalizedTerms.forEach(term => {
      if (ingredient.includes(term.toLowerCase())) {
        matchedTerms.add(term);
      }
    });

    matchesByRecipe.set(row.recipe_id, matchedTerms);
  });

  return [...matchesByRecipe.entries()]
    .filter(([, termSet]) => termSet.size === normalizedTerms.length)
    .map(([recipeId]) => recipeId);
}

async function getRecipes(params) {
  const { search, category, ingredients, exclude = [], limit, ids } = params;
  const searchParams = { select: 'id,name,category,description,time,image_url' };

  if (category) {
    searchParams.category = `eq.${category}`;
  }

  if (search) {
    searchParams.or = `(name.ilike.%${search}%,description.ilike.%${search}%)`;
  }

  if (ids) {
    const idList = ids
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    if (idList.length > 0) {
      searchParams.id = `in.(${idList.join(',')})`;
    }
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

  const excludeIds = exclude?.length ? await fetchRecipeIdsByIngredients(exclude) : [];

  const query = buildQuery(searchParams);
  const data = await supabaseRequest(`/recipes${query}`);
  const excludedSet = new Set(excludeIds);
  return data
    .filter(record => !excludedSet.has(record.id))
    .map(normalizeRecipe);
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
