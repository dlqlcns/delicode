// ===========================================
// mypage.js - 사용자 정보 연동
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  const usernameElement = document.querySelector('.profile-card .username');
  const allergyTags = document.querySelector('.allergy-card .tags');
  const categoryTags = document.querySelector('.category-card .tags');
  const ingredientsContainer = document.querySelector('.ingredients');
  const recipeContainer = document.getElementById('recipeContainer');

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  async function requireLogin() {
    const stored = getStoredUser();
    if (!stored) {
      alert('로그인이 필요합니다.');
      window.location.href = 'login.html';
      throw new Error('Not authenticated');
    }
    return stored;
  }

  function renderTags(container, values, emptyMessage, tagClass = 'tag') {
    if (!container) return;
    container.innerHTML = '';

    if (!values || values.length === 0) {
      container.innerHTML = `<p style="color: #495565; font-size: 14px;">${emptyMessage}</p>`;
      return;
    }

    values.forEach(value => {
      const tag = document.createElement('span');
      tag.className = tagClass;
      tag.textContent = value;
      container.appendChild(tag);
    });
  }

  function renderIngredients(values = []) {
    if (!ingredientsContainer) return;
    ingredientsContainer.innerHTML = '';

    if (!values.length) {
      ingredientsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #888;">
          <p>등록된 재료가 없습니다.</p>
          <p style="font-size: 14px; margin-top: 8px;">
            <a href="myplus.html" style="color: #3459ff; text-decoration: underline;">
              재료 등록하기
            </a>
          </p>
        </div>
      `;
      return;
    }

    values.forEach(name => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient';
      ingredientDiv.innerHTML = `
        <span class="name">${name}</span>
        <span class="badge" style="background: #f3f4f6; color: #6b7280;">재료</span>
      `;
      ingredientsContainer.appendChild(ingredientDiv);
    });
  }

  function renderUser(user) {
    if (usernameElement) {
      usernameElement.textContent = `${user.username}님!`;
    }

    renderTags(allergyTags, user.allergies || [], '설정된 알레르기가 없습니다.');
    renderTags(categoryTags, user.ingredients || [], '설정된 선호 카테고리가 없습니다.', 'category-tag');
    renderIngredients(user.ingredients || []);
  }

  function renderFavoritePreview(recipes = []) {
    if (!recipeContainer) return;
    recipeContainer.innerHTML = '';

    if (!recipes.length) {
      recipeContainer.innerHTML = '<p style="color:#888;text-align:center;width:100%;">즐겨찾기한 레시피가 없습니다.</p>';
      return;
    }

    recipes.slice(0, 4).forEach(recipe => {
      const card = document.createElement('a');
      card.className = 'recipe-mini-card';
      card.href = `recipe_detail.html?id=${recipe.id}`;
      card.innerHTML = `
        <div class="recipe-mini-thumb" style="background-image:url('${recipe.image || recipe.image_url || ''}')"></div>
        <div class="recipe-mini-body">
          <h3 class="recipe-mini-title">${recipe.name}</h3>
          <p class="recipe-mini-meta">${recipe.category || ''} · ${recipe.time || ''}</p>
        </div>
      `;
      recipeContainer.appendChild(card);
    });
  }

  async function loadFavorites(userId) {
    if (!recipeContainer) return;
    recipeContainer.innerHTML = '<p style="text-align:center;color:#888;width:100%;">즐겨찾기를 불러오는 중...</p>';
    try {
      const { favorites } = await window.apiClient.fetchFavorites(userId);
      if (!favorites || favorites.length === 0) {
        renderFavoritePreview([]);
        return;
      }

      const recipesResponse = await window.apiClient.fetchRecipes({ ids: favorites.join(',') });
      const recipes = (recipesResponse.recipes || []).map(window.apiClient.normalizeRecipeForCards);
      renderFavoritePreview(recipes);
    } catch (err) {
      console.error(err);
      recipeContainer.innerHTML = '<p style="color:#cc0000;text-align:center;width:100%;">즐겨찾기를 불러오지 못했습니다.</p>';
    }
  }

  async function loadPage() {
    const stored = await requireLogin();
    try {
      const response = await window.apiClient.fetchUserApi(stored.id);
      if (!response?.user) throw new Error('사용자 정보를 불러오지 못했습니다.');
      const user = response.user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      renderUser(user);
      await loadFavorites(user.id);
    } catch (err) {
      console.error(err);
      alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    }
  }

  loadPage();
});
