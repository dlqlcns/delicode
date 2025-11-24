// ============================================
// recipe_all.js - 전체 레시피 페이지 (백엔드 연동)
// ============================================
// ⚠️ recipe_res_block.js가 먼저 로드되어야 합니다.

let allRecipes = [];
let currentRecipes = [];
let favoriteIds = new Set();

const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');

const FAVORITES_PREFIX = 'favorites_user_';
const RECIPES_CACHE_KEY = 'allRecipesCache';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function normalizeIds(ids) {
  return Array.from(new Set((ids || []).map(id => Number(id)).filter(Number.isFinite)));
}

function readFavorites(userId) {
  if (!userId) return [];
  const key = `${FAVORITES_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return normalizeIds(parsed);
  } catch (err) {
    console.warn('즐겨찾기 정보를 불러올 수 없습니다. 빈 목록으로 초기화합니다.', err);
    return [];
  }
}

function writeFavorites(userId, ids) {
  if (!userId) return [];
  const normalized = normalizeIds(ids);
  const key = `${FAVORITES_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch (err) {
    console.warn('즐겨찾기를 저장하는 중 문제가 발생했습니다.', err);
  }
  return normalized;
}

function cacheRecipes(recipes) {
  try {
    localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(recipes));
  } catch (err) {
    console.warn('레시피 캐시를 저장하지 못했습니다.', err);
  }
}

function loadCachedRecipes() {
  try {
    const raw = localStorage.getItem(RECIPES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('저장된 레시피 캐시를 불러오지 못했습니다.', err);
    return [];
  }
}

function loadFavorites(recipes) {
  const user = getCurrentUser();
  if (!user) {
    favoriteIds = new Set();
    recipes.forEach(recipe => { recipe.bookmarked = false; });
    return;
  }

  const favorites = readFavorites(user.id);
  favoriteIds = new Set(favorites);
  recipes.forEach(recipe => {
    recipe.bookmarked = favoriteIds.has(Number(recipe.id));
  });
}

function renderRecipes() {
  if (!recipeList) return;

  recipeList.innerHTML = '';

  if (!currentRecipes || currentRecipes.length === 0) {
    recipeList.innerHTML = '<p style="text-align:center;color:#888;font-size:1.1rem;grid-column:1/-1">검색 결과가 없습니다.</p>';
    return;
  }

  currentRecipes.forEach(r => {
    const card = createRecipeBlock(r);
    recipeList.appendChild(card);
  });

  attachBookmarkListeners(onBookmarkClicked);
}

function onBookmarkClicked(id) {
  const user = getCurrentUser();
  if (!user) return;

  const numericId = Number(id);
  const idx = allRecipes.findIndex(x => Number(x.id) === numericId);
  if (idx < 0) return;

  const isBookmarked = !allRecipes[idx].bookmarked;
  allRecipes[idx].bookmarked = isBookmarked;

  const favoritesArray = Array.from(favoriteIds);
  let updatedFavorites;
  if (isBookmarked) {
    updatedFavorites = [...favoritesArray, numericId];
  } else {
    updatedFavorites = favoritesArray.filter(favId => favId !== numericId);
  }

  favoriteIds = new Set(writeFavorites(user.id, updatedFavorites));

  if (sortSelect && sortSelect.value === '인기순') {
    applyFilters();
  } else {
    const btn = document.querySelector(`.bookmark-btn[data-bookmark-id="${id}"]`);
    if (btn) {
      btn.textContent = isBookmarked ? '♥' : '♡';
      btn.classList.toggle('active', isBookmarked);
    }
  }

  const recipeName = allRecipes[idx].name;
  if (isBookmarked) {
    showToastNotification(
      `"${recipeName}"이(가) 즐겨찾기에 추가되었습니다.`,
      '이동',
      () => { window.location.href = 'my_fav.html'; },
    );
  } else {
    showToastNotification(`"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`);
  }
}

function applyFilters() {
  const selectedCategory = categorySelect?.value || '전체';
  const sortOption = sortSelect?.value || '최신순';

  let filtered = [...allRecipes];
  if (selectedCategory !== '전체') {
    filtered = filtered.filter(r => r.category === selectedCategory);
  }

  switch (sortOption) {
    case '인기순':
      filtered.sort((a, b) => (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0));
      break;
    case '조리 시간순':
      filtered.sort((a, b) => parseInt(a.time) - parseInt(b.time));
      break;
    case '이름순':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      filtered.sort((a, b) => (a.id < b.id ? 1 : -1));
      break;
  }

  currentRecipes = filtered;
  renderRecipes();
}

async function loadRecipes() {
  try {
    const response = await window.apiClient.fetchRecipes();
    allRecipes = (response.recipes || []).map(window.apiClient.normalizeRecipeForCards);
    cacheRecipes(allRecipes);
  } catch (err) {
    console.error(err);
    const cached = loadCachedRecipes();
    allRecipes = Array.isArray(cached) ? cached : [];
    if (recipeList && allRecipes.length === 0) {
      recipeList.innerHTML = '<p style="text-align:center;color:#cc0000;font-size:1.1rem;grid-column:1/-1">레시피를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>';
      return;
    }
  }

  loadFavorites(allRecipes);
  currentRecipes = [...allRecipes];
  applyFilters();
}

if (categorySelect) categorySelect.addEventListener('change', applyFilters);
if (sortSelect) sortSelect.addEventListener('change', () => {
  applyFilters();
});

document.addEventListener('DOMContentLoaded', loadRecipes);
