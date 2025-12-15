import { getRecipes, getIngredientsByRecipeIds } from './recipesApi.js';

function normalizeList(values = []) {
  if (typeof values === 'string') {
    return values
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }

  return (Array.isArray(values) ? values : [])
    .map(value => String(value || '').trim())
    .filter(Boolean);
}

function toLowerSet(list = []) {
  return new Set(list.map(item => item.toLowerCase()));
}

function buildIngredientIndex(map, recipeId) {
  const items = map.get(recipeId) || [];
  return items.map(item => item.toLowerCase());
}

function countMatches(ingredients, terms) {
  const lowerIngredients = ingredients.map(item => item.toLowerCase());
  return terms.filter(term => lowerIngredients.some(ing => ing.includes(term.toLowerCase())));
}

function scoreRecipe(recipe, ingredientMap, { searchTerms, fridgeTerms, preferredCategories }) {
  const ingredientList = buildIngredientIndex(ingredientMap, recipe.id);
  const matchedSearch = countMatches(ingredientList, searchTerms);
  const matchedFridge = countMatches(ingredientList, fridgeTerms);

  const hasAllSearch = searchTerms.length > 0
    ? searchTerms.every(term => ingredientList.some(ing => ing.includes(term.toLowerCase())))
    : false;

  const hasAllFridge = fridgeTerms.length > 0
    ? fridgeTerms.every(term => ingredientList.some(ing => ing.includes(term.toLowerCase())))
    : false;

  const categoryBonus = preferredCategories.has(recipe.category) ? 3 : 0;
  const completenessBonus = hasAllSearch ? 8 : 0;
  const fridgeBonus = hasAllFridge ? 2 : 0;
  const similarityBonus = ingredientList.length
    ? (matchedSearch.length + matchedFridge.length) / ingredientList.length
    : 0;

  const score = (matchedSearch.length * 3)
    + (matchedFridge.length * 2)
    + categoryBonus
    + completenessBonus
    + fridgeBonus
    + similarityBonus;

  return {
    recipe,
    score,
    matchedSearch,
    matchedFridge,
  };
}

export async function generateRecipeSuggestions({
  ingredients = [],
  fridgeItems = [],
  exclude = [],
  preferredCategories = [],
  username = '',
  limit = 8,
} = {}) {
  const searchTerms = normalizeList(ingredients);
  const fridgeTerms = normalizeList(fridgeItems);
  const excludeTerms = normalizeList(exclude);
  const preferredSet = toLowerSet(normalizeList(preferredCategories));

  const baseRecipes = await getRecipes({ exclude: excludeTerms.join(','), limit: 200 });
  if (!baseRecipes.length) return [];

  const ingredientMap = await getIngredientsByRecipeIds(baseRecipes.map(recipe => recipe.id));

  const scored = baseRecipes.map((recipe, index) => ({
    ...scoreRecipe(recipe, ingredientMap, {
      searchTerms,
      fridgeTerms,
      preferredCategories: preferredSet,
    }),
    order: index,
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedSearch.length !== a.matchedSearch.length) return b.matchedSearch.length - a.matchedSearch.length;
    if (b.matchedFridge.length !== a.matchedFridge.length) return b.matchedFridge.length - a.matchedFridge.length;
    return a.order - b.order;
  });

  const top = scored.slice(0, limit).map(entry => ({
    ...entry.recipe,
  }));

  return top;
}
