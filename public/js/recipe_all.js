// ============================================
// recipe_all.js - 전체 레시피 페이지 (백엔드 연동)
// ============================================
// ⚠️ recipe_res_block.js가 먼저 로드되어야 합니다.

let allRecipes = [];
let currentRecipes = [];

const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');

function loadFavorites(recipes) {
  const favs = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
  recipes.forEach(recipe => {
    recipe.bookmarked = favs.has(recipe.id);
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
  const idx = allRecipes.findIndex(x => x.id === id);
  if (idx < 0) return;

  allRecipes[idx].bookmarked = !allRecipes[idx].bookmarked;
  const isBookmarked = allRecipes[idx].bookmarked;
  const recipeName = allRecipes[idx].name;

  let favs = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
  if (isBookmarked) {
    favs.add(id);
  } else {
    favs.delete(id);
  }
  localStorage.setItem('favorites', JSON.stringify([...favs]));

  if (sortSelect && sortSelect.value === '인기순') {
    applyFilters();
  } else {
    const btn = document.querySelector(`.bookmark-btn[data-bookmark-id="${id}"]`);
    if (btn) {
      btn.textContent = isBookmarked ? '♥' : '♡';
      btn.classList.toggle('active', isBookmarked);
    }
  }

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
    loadFavorites(allRecipes);
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