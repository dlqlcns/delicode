// ============================================
// recipe_all.js - 전체 레시피 페이지 (백엔드 연동)
// ============================================
// ⚠️ recipe_res_block.js가 먼저 로드되어야 합니다.

let allRecipes = [];
let currentRecipes = [];
let favoriteIds = new Set();

const SAMPLE_RECIPES = [
  {
    id: 1,
    name: '간장계란밥',
    description: '바쁜 아침을 위한 초간단 한그릇 요리',
    image: '/img/recipe_images/ganjang_egg_rice.jpg',
    category: '한식',
    time: '10분',
    bookmarked: false,
  },
  {
    id: 2,
    name: '토마토 파스타',
    description: '신선한 토마토가 듬뿍 들어간 클래식 파스타',
    image: '/img/recipe_images/tomato_pasta.jpg',
    category: '양식',
    time: '25분',
    bookmarked: false,
  },
  {
    id: 3,
    name: '치킨 가라아게',
    description: '겉바속촉 일본식 닭튀김',
    image: '/img/recipe_images/karaage.jpg',
    category: '일식',
    time: '30분',
    bookmarked: false,
  },
  {
    id: 4,
    name: '새우 팟타이',
    description: '달콤짭짤한 소스가 매력적인 태국식 볶음 쌀국수',
    image: '/img/recipe_images/pad_thai.jpg',
    category: '동남아',
    time: '20분',
    bookmarked: false,
  },
  {
    id: 5,
    name: '시저 샐러드',
    description: '상큼한 드레싱과 크루통이 어우러진 기본 샐러드',
    image: '/img/recipe_images/caesar_salad.jpg',
    category: '샐러드',
    time: '15분',
    bookmarked: false,
  },
  {
    id: 6,
    name: '티라미수',
    description: '커피 향 가득한 부드러운 이탈리안 디저트',
    image: '/img/recipe_images/tiramisu.jpg',
    category: '디저트',
    time: '40분',
    bookmarked: false,
  },
];

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
    if (Array.isArray(cached) && cached.length > 0) {
      allRecipes = cached;
    } else {
      allRecipes = SAMPLE_RECIPES;
    }
    cacheRecipes(allRecipes);
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
