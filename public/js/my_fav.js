// ===========================================
// my_fav.js - 즐겨찾기 페이지 (알림 스타일 통합됨)
// ===========================================
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!

let currentRecipes = [];
let favoriteIds = new Set();
let recipesById = new Map();

// DOM 요소
const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const favSearchInput = document.getElementById('favSearchInput');
const favSearchIcon = document.getElementById('favSearchIcon');

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

async function loadFavorites() {
  const user = getCurrentUser();
  if (!user) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const { favorites } = await window.apiClient.fetchFavorites(user.id);
    favoriteIds = new Set(favorites || []);

    if (favoriteIds.size === 0) {
      recipesById = new Map();
      currentRecipes = [];
      renderRecipes();
      return;
    }

    const recipeResponse = await window.apiClient.fetchRecipes({ ids: [...favoriteIds].join(',') });
    recipesById = new Map((recipeResponse.recipes || []).map(r => {
      const normalized = window.apiClient.normalizeRecipeForCards(r);
      return [normalized.id, { ...normalized, bookmarked: true }];
    }));

    filterRecipes();
  } catch (err) {
    console.error(err);
    if (recipeList) {
      recipeList.innerHTML = '<p style="text-align:center;color:#cc0000;font-size:1.1rem;grid-column:1/-1">즐겨찾기를 불러오지 못했습니다.</p>';
    }
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

    loadFavorites(); // 초기 로드

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
        
        // 실시간 검색 (입력할 때마다)
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
    // 즐겨찾기 페이지이므로 항상 bookmarked=true 상태로 렌더링
    const card = createRecipeBlock({...r, bookmarked: true}); 
    recipeList.appendChild(card);
  });

  attachBookmarkListeners(onBookmarkClicked); 
}

async function onBookmarkClicked(id) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    await window.apiClient.removeFavoriteApi(user.id, id);
    favoriteIds.delete(id);
    recipesById.delete(id);
    filterRecipes();
    showToastNotification('즐겨찾기에서 해제되었습니다.');
  } catch (err) {
    console.error(err);
    showToastNotification('즐겨찾기 해제에 실패했습니다.');
  }
}

function filterRecipes() {
    let filtered = [...recipesById.values()].filter(recipe => favoriteIds.has(recipe.id));
    
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