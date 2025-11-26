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

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function getUserAllergies() {
  const user = getCurrentUser();
  return Array.isArray(user?.allergies)
    ? user.allergies.filter(value => value && value.trim().length > 0)
    : [];
}

function getUserPreferredCategories() {
  const user = getCurrentUser();
  return Array.isArray(user?.ingredients)
    ? user.ingredients.map(value => value.trim()).filter(Boolean)
    : [];
}

function updateSubtitle(allergies) {
  const subtitleEl = document.querySelector('.all-recipes-subtitle');
  if (!subtitleEl) return;

  if (allergies.length) {
    subtitleEl.textContent = `알레르기 재료(${allergies.join(', ')})가 포함된 레시피는 자동으로 제외했습니다.`;
  } else {
    subtitleEl.textContent = '취향에 맞는 레시피를 찾아보세요.';
  }
}

async function loadFavorites(recipes) {
  const user = getCurrentUser();
  if (!user) {
    favoriteIds = new Set();
    recipes.forEach(recipe => { recipe.bookmarked = false; });
    return;
  }

  try {
    const response = await window.apiClient.fetchFavorites(user.id);
    favoriteIds = new Set((response.favorites || []).map(String));
    recipes.forEach(recipe => {
      recipe.bookmarked = favoriteIds.has(String(recipe.id));
    });
  } catch (err) {
    console.error(err);
  }
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

async function onBookmarkClicked(id, isActive) {
  const user = getCurrentUser();
  if (!user) return;

  const idx = allRecipes.findIndex(x => String(x.id) === String(id));
  if (idx < 0) return;

  try {
    const response = isActive
      ? await window.apiClient.addFavoriteApi(user.id, id)
      : await window.apiClient.removeFavoriteApi(user.id, id);

    favoriteIds = new Set((response.favorites || []).map(String));
    allRecipes[idx].bookmarked = favoriteIds.has(String(id));

    if (sortSelect && sortSelect.value === '인기순') {
      applyFilters();
    } else {
      const btn = document.querySelector(`.bookmark-btn[data-bookmark-id="${id}"]`);
      if (btn) {
        const isBookmarked = favoriteIds.has(String(id));
        btn.textContent = isBookmarked ? '♥' : '♡';
        btn.classList.toggle('active', isBookmarked);
      }
    }

    const recipeName = allRecipes[idx].name;
    if (favoriteIds.has(String(id))) {
      showToastNotification(
        `"${recipeName}"이(가) 즐겨찾기에 추가되었습니다.`,
        '이동',
        () => { window.location.href = 'my_fav.html'; },
      );
    } else {
      showToastNotification(`"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`);
    }
  } catch (err) {
    console.error(err);
    throw err;
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

  const prioritized = prioritizePreferredCategories(filtered);

  currentRecipes = prioritized;
  renderRecipes();
}

function prioritizePreferredCategories(recipes) {
  const preferred = getUserPreferredCategories();
  if (!preferred.length) return recipes;

  const preferredSet = new Set(preferred);
  const preferredRecipes = [];
  const otherRecipes = [];

  recipes.forEach(recipe => {
    if (preferredSet.has(recipe.category)) {
      preferredRecipes.push(recipe);
    } else {
      otherRecipes.push(recipe);
    }
  });

  return [...preferredRecipes, ...otherRecipes];
}

async function loadRecipes() {
  try {
    const allergies = getUserAllergies();
    updateSubtitle(allergies);

    const response = await window.apiClient.fetchRecipes({
      exclude: allergies.join(','),
    });
    allRecipes = (response.recipes || []).map(window.apiClient.normalizeRecipeForCards);
    await loadFavorites(allRecipes);
    currentRecipes = [...allRecipes];
    applyFilters();
  } catch (err) {
    console.error(err);
    if (recipeList) {
      recipeList.innerHTML = '<p style="text-align:center;color:#cc0000;font-size:1.1rem;grid-column:1/-1">레시피를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>';
    }
  }
}

if (categorySelect) categorySelect.addEventListener('change', applyFilters);
if (sortSelect) sortSelect.addEventListener('change', () => {
  applyFilters();
});

document.addEventListener('DOMContentLoaded', loadRecipes);