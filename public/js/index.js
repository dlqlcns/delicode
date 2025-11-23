// ============================================
// index.js - 메인 페이지
// ============================================
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!

let recipes = [];

function renderRecipeCards() {
  const recipeGrid = document.getElementById('recipeGrid');
  if (!recipeGrid) return;

  recipeGrid.innerHTML = '';

  recipes.forEach(recipe => {
    const card = createRecipeBlock(recipe);

    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('bookmark-btn')) {
        window.location.href = `recipe_detail.html?id=${encodeURIComponent(recipe.id)}`;
      }
    });

    recipeGrid.appendChild(card);
  });

  attachBookmarkListeners(handleBookmarkClick);
}

function handleBookmarkClick(id) {
  const recipeIndex = recipes.findIndex(r => r.id === id);
  if (recipeIndex > -1) {
    recipes[recipeIndex].bookmarked = !recipes[recipeIndex].bookmarked;
    renderRecipeCards();
  }
}

async function loadRecommendedRecipes() {
  const status = document.getElementById('recipeStatus');
  try {
    if (status) status.textContent = '추천 레시피를 불러오는 중입니다...';
    const response = await window.apiClient.fetchRecipes({ limit: 6 });
    recipes = (response.recipes || []).map(window.apiClient.normalizeRecipeForCards);
    renderRecipeCards();
    if (status) status.textContent = recipes.length ? '' : '표시할 레시피가 없습니다.';
  } catch (err) {
    console.error(err);
    if (status) status.textContent = '레시피를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecommendedRecipes();
});

// ===========================================
// 헤더 검색 (headerSearchInput) Enter 키 이벤트 리스너
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  const headerSearchInput = document.getElementById("headerSearchInput");

  if (headerSearchInput) {
    headerSearchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        const query = headerSearchInput.value.trim();

        if (query) {
          let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          recentSearches = recentSearches.filter(term => term !== query);
          recentSearches.unshift(query);
          if (recentSearches.length > 10) {
            recentSearches = recentSearches.slice(0, 10);
          }
          localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

          const ingredients = query.replace(/\s+/g, ',');
          window.location.href = `recipe_results.html?ingredients=${encodeURIComponent(ingredients)}`;
        }
      }
    });
  }

  const favSearchInput = document.getElementById('favSearchInput');
  if (favSearchInput) {
    favSearchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof filterRecipes === 'function') {
          filterRecipes();
        }
      }
    });
  }
});
