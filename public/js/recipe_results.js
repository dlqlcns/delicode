// ============================================
// recipe_results.js - 검색 결과 페이지 (백엔드 연동)
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!
// ============================================

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

async function syncFavorites() {
  const user = getCurrentUser();
  if (!user) {
    favoriteIds = new Set();
    currentRecipes.forEach(recipe => { recipe.bookmarked = false; });
    return;
  }

  try {
    const response = await window.apiClient.fetchFavorites(user.id);
    favoriteIds = new Set(response.favorites || []);
    currentRecipes.forEach(recipe => {
      recipe.bookmarked = favoriteIds.has(recipe.id);
    });
  } catch (err) {
    console.error(err);
  }
}

function createTag(term, type) {
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.style.cursor = 'pointer';
  tag.dataset.type = type;
  tag.dataset.value = term;

  tag.innerHTML = `
        <span>${term}</span>
        <button class="tag-close">×</button>
    `;

  tag.addEventListener('click', function(e) {
    if (!e.target.classList.contains('tag-close')) {
      window.location.href = `recipe_results.html?ingredients=${encodeURIComponent(term)}`;
    }
  });

  const closeBtn = tag.querySelector('.tag-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTagFromSearch(type, term);
    });
  }

  return tag;
}

function removeTagFromSearch(type, term) {
  const params = new URLSearchParams(window.location.search);

  if (type === 'query') {
    params.delete('query');
  } else if (type === 'ingredients') {
    const ingredients = (params.get('ingredients') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(value => value !== term);

    if (ingredients.length > 0) {
      params.set('ingredients', ingredients.join(','));
    } else {
      params.delete('ingredients');
    }
  }

  window.location.search = params.toString();
}

function displayTags(params) {
  const tagContainer = document.getElementById("tagContainer");
  const resultsTitle = document.getElementById('resultsTitle');
  if (!tagContainer || !resultsTitle) return;

  tagContainer.innerHTML = '';

  const query = params.get('query') || '';
  const ingredientsParam = params.get('ingredients') || '';

  const ingredients = ingredientsParam
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const tags = [];

  if (query.trim() !== '') {
    tags.push(createTag(query.trim(), 'query'));
  }

  ingredients.forEach(ing => {
    tags.push(createTag(ing, 'ingredients'));
  });

  tagContainer.append(...tags);

  const allTerms = [];
  if (query.trim() !== '') allTerms.push(query.trim());
  allTerms.push(...ingredients);

  if (allTerms.length > 0) {
    const formatted = allTerms.map(t => `"${t}"`).join(', ');
    resultsTitle.innerHTML = `${formatted}로 입력한 결과입니다.`;
  } else {
    resultsTitle.textContent = "레시피 검색 결과입니다.";
  }

  tagContainer.style.display = tags.length > 0 ? 'flex' : 'none';
}

function renderRecipes(recipes) {
  const resultsSubtitle = document.getElementById('resultsSubtitle');
  if (!recipeList || !resultsSubtitle) return;

  recipeList.innerHTML = '';

  const urlParams = new URLSearchParams(window.location.search);
  const excludeString = urlParams.get('exclude') || '';
  const excludeTerms = excludeString.split(',').map(s => s.trim()).filter(Boolean);

  let subtitle = `총 ${recipes.length}개의 레시피가 검색되었습니다.`;

  if (excludeTerms.length > 0) {
    subtitle += ` ${excludeTerms.map(t => `"${t}"`).join(', ')} 결과는 제외했습니다.`;
  }

  resultsSubtitle.textContent = subtitle;

  if (recipes.length === 0) {
    recipeList.innerHTML =
            '<p style="text-align:center; color:#888; grid-column:1/-1;">검색 결과가 없습니다.</p>';
    return;
  }

  recipes.forEach(recipe => {
    const card = createRecipeBlock(recipe);

    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('bookmark-btn')) {
        window.location.href = `recipe_detail.html?id=${encodeURIComponent(recipe.id)}`;
      }
    });

    recipeList.appendChild(card);
  });

  attachBookmarkListeners(toggleBookmark);
}

function sortRecipes(recipes, sortBy) {
  const sorted = [...recipes];
  switch (sortBy) {
    case 'time-asc':
      sorted.sort((a, b) => parseInt(a.time) - parseInt(b.time));
      break;
    case 'time-desc':
      sorted.sort((a, b) => parseInt(b.time) - parseInt(a.time));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }
  return sorted;
}

async function toggleBookmark(id, isActive) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const response = isActive
      ? await window.apiClient.addFavoriteApi(user.id, id)
      : await window.apiClient.removeFavoriteApi(user.id, id);
    favoriteIds = new Set(response.favorites || []);
    currentRecipes.forEach(recipe => {
      recipe.bookmarked = favoriteIds.has(recipe.id);
    });
    renderRecipes(currentRecipes);

    const target = currentRecipes.find(r => r.id === id);
    if (favoriteIds.has(id)) {
      showToastNotification(
        `${target?.name || '레시피'}가 즐겨찾기에 추가되었습니다.`,
        '즐겨찾기 보기',
        () => { window.location.href = 'my_fav.html'; },
      );
    } else {
      showToastNotification(`${target?.name || '레시피'} 즐겨찾기를 해제했습니다.`);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function loadResults() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('query') || '';
  const ingredientsParam = params.get('ingredients') || '';
  const categoryParam = params.get('category') || '';
  const excludeParam = params.get('exclude') || '';

  if (categorySelect && categoryParam) {
    categorySelect.value = categoryParam;
  }

  displayTags(params);

  try {
    const response = await window.apiClient.fetchRecipes({
      search: query,
      ingredients: ingredientsParam,
      category: categoryParam && categoryParam !== '전체' ? categoryParam : '',
      exclude: excludeParam,
    });

    currentRecipes = (response.recipes || []).map(window.apiClient.normalizeRecipeForCards);
    await syncFavorites();
    const sorted = sortRecipes(currentRecipes, sortSelect ? sortSelect.value : '');
    renderRecipes(sorted);
  } catch (err) {
    console.error(err);
    if (recipeList) {
      recipeList.innerHTML = '<p style="text-align:center; color:#cc0000; grid-column:1/-1;">검색 결과를 불러오지 못했습니다.</p>';
    }
  }
}

if (categorySelect) {
  categorySelect.addEventListener('change', () => {
    const params = new URLSearchParams(window.location.search);
    params.set('category', categorySelect.value);
    window.location.search = params.toString();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    const sorted = sortRecipes(currentRecipes, sortSelect.value);
    renderRecipes(sorted);
  });
}

document.addEventListener('DOMContentLoaded', loadResults);

const headerSearchInput = document.getElementById('headerSearchInput');
if (headerSearchInput) {
  headerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
}
