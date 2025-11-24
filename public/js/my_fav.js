// ===========================================
// my_fav.js - 즐겨찾기 페이지 (알림 스타일 통합됨)
// ===========================================
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!

let currentRecipes = [];
let favoriteIds = new Set();
let recipesById = new Map();

const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const favSearchInput = document.getElementById('favSearchInput');

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
    console.warn('즐겨찾기를 불러올 수 없습니다. 빈 목록으로 초기화합니다.', err);
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
    console.warn('즐겨찾기 저장 중 문제가 발생했습니다.', err);
  }
  return normalized;
}

function loadCachedRecipes() {
  try {
    const raw = localStorage.getItem(RECIPES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('레시피 캐시를 불러오지 못했습니다.', err);
    return [];
  }
}

function cacheRecipes(recipes) {
  try {
    localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(recipes));
  } catch (err) {
    console.warn('레시피 캐시 저장에 실패했습니다.', err);
  }
}

// ============================================
// DOMContentLoaded 및 이벤트 리스너
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }

  loadFavorites();

  // 헤더 검색 (headerSearchInput)
  const headerSearchInput = document.getElementById("headerSearchInput");
  if (headerSearchInput) {
    headerSearchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        const query = headerSearchInput.value.trim();
        if (query) {
          let recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          recent = recent.filter(t => t !== query);
          recent.unshift(query);
          localStorage.setItem('recentSearches', JSON.stringify(recent.slice(0, 10)));

          const ingredients = query.replace(/\s+/g, ',');
          window.location.href = `recipe_results.html?ingredients=${encodeURIComponent(ingredients)}`;
        }
      }
    });
  }

  // 페이지 내 검색 (favSearchInput)
  if (favSearchInput) {
    favSearchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterRecipes();
      }
    });

    favSearchInput.addEventListener('input', () => {
      filterRecipes();
    });
  }

  // 검색 아이콘 클릭 시
  const favSearchIconElement = document.querySelector('.search-containerr .search-icon');
  if (favSearchIconElement) {
    favSearchIconElement.addEventListener('click', () => {
      filterRecipes();
    });
  }
});

if (categorySelect) categorySelect.addEventListener('change', filterRecipes);
if (sortSelect) sortSelect.addEventListener('change', filterRecipes);


// ============================================
// 렌더링 및 필터링 로직
// ============================================

function renderRecipes() {
  if (!recipeList) return;
  recipeList.innerHTML = '';

  if (!currentRecipes || currentRecipes.length === 0) {
    recipeList.innerHTML = '<p style="text-align:center;color:#888;font-size:1.1rem;grid-column:1/-1">즐겨찾기 된 레시피가 없습니다.</p>';
    return;
  }

  currentRecipes.forEach(r => {
    const card = createRecipeBlock({ ...r, bookmarked: true });
    recipeList.appendChild(card);
  });

  attachBookmarkListeners(onBookmarkClicked);
}

async function loadFavorites() {
  const user = getCurrentUser();
  if (!user) return;

  favoriteIds = new Set(readFavorites(user.id));

  let recipePool = [];
  try {
    const response = await window.apiClient.fetchRecipes();
    recipePool = (response.recipes || []).map(window.apiClient.normalizeRecipeForCards);
    cacheRecipes(recipePool);
  } catch (err) {
    console.error(err);
    recipePool = loadCachedRecipes();
  }

  recipesById = new Map((recipePool || []).map(r => [Number(r.id), { ...r, bookmarked: favoriteIds.has(Number(r.id)) }]));
  filterRecipes();
}

function onBookmarkClicked(id) {
  const user = getCurrentUser();
  if (!user) return;

  const numericId = Number(id);
  const recipeName = recipesById.get(numericId)?.name || '레시피';
  favoriteIds.delete(numericId);
  writeFavorites(user.id, Array.from(favoriteIds));
  recipesById.delete(numericId);

  filterRecipes();
  showToastNotification(`"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`);
}

function filterRecipes() {
  let filtered = [...recipesById.values()].filter(recipe => favoriteIds.has(Number(recipe.id)));

  const selectedCategory = categorySelect?.value || '전체';
  const sortOption = sortSelect?.value || '최신순';
  const searchQuery = favSearchInput?.value.toLowerCase().trim() || '';

  if (selectedCategory !== '전체') {
    filtered = filtered.filter(r => r.category === selectedCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery) ||
      recipe.description.toLowerCase().includes(searchQuery)
    );
  }

  switch (sortOption) {
    case '이름순':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case '조리 시간순':
      filtered.sort((a, b) => parseInt(a.time) - parseInt(b.time));
      break;
    case '최신순':
    default:
      filtered.sort((a, b) => (a.id < b.id ? 1 : (a.id > b.id ? -1 : 0)));
      break;
  }

  currentRecipes = filtered;
  renderRecipes();
}
