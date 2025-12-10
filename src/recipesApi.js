import { supabaseRequest, buildQuery, generateId } from './supabaseClient.js';

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

async function findRecipeByName(name) {
  if (!name) return null;
  const query = buildQuery({
    select: 'id,name,category,description,time,image_url',
    name: `eq.${name}`,
    limit: 1,
  });

  const records = await supabaseRequest(`/recipes${query}`);
  const record = records?.[0];
  return record ? normalizeRecipe(record) : null;
}

async function saveIngredients(recipeId, ingredients = []) {
  if (!ingredients.length) return;

  const payload = ingredients
    .map(item => ({
      recipe_id: recipeId,
      ingredient: item.ingredient || item.name || '',
      amount: item.amount || '',
      unit: item.unit || '',
    }))
    .filter(entry => entry.ingredient);

  if (!payload.length) return;

  await supabaseRequest('/recipe_ingredients', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: payload,
  });
}

async function saveSteps(recipeId, steps = []) {
  if (!steps.length) return;

  const payload = steps.map((step, index) => {
    const numericOrder = Number.isFinite(step?.step_order)
      ? Number(step.step_order)
      : Number.isFinite(Number(step?.order))
        ? Number(step.order)
        : Number.isFinite(Number(step))
          ? Number(step)
          : Number.isFinite(parseInt(step?.step_order, 10))
            ? parseInt(step.step_order, 10)
            : null;

    return {
      recipe_id: recipeId,
      step_order: Number.isFinite(numericOrder) ? numericOrder : index + 1,
      step_description: step?.step_description || step?.description || String(step || ''),
    };
  });

  const filtered = payload.filter(item => item.step_description);
  if (!filtered.length) return;

  await supabaseRequest('/recipe_steps', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: filtered,
  });
}

async function createRecipeWithDetails(recipe) {
  const id = recipe.id || generateId();
  const payload = [{
    id,
    name: recipe.name,
    category: recipe.category || '기타',
    description: recipe.description || 'Gemini가 제안한 레시피입니다.',
    time: recipe.time || '30분',
    image_url: recipe.image_url || '',
  }];

  await supabaseRequest('/recipes', {
    method: 'POST',
    prefer: 'return=representation',
    body: payload,
  });

  await saveIngredients(id, recipe.ingredients || []);
  await saveSteps(id, recipe.steps || []);

  return { id, ...payload[0] };
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

export {
  getRecipes,
  getRecipeDetail,
  createRecipeWithDetails,
  findRecipeByName,
};
