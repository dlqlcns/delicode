// ===========================================
// mypage.js - 사용자 정보 연동
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  const usernameElement = document.querySelector('.profile-card .username');
  const allergyTags = document.querySelector('.allergy-card .tags');
  const categoryTags = document.querySelector('.category-card .tags');
  const ingredientsContainer = document.querySelector('.ingredients');
  const recipeContainer = document.getElementById('recipeContainer');
  const guardElement = document.getElementById('mypageGuard');
  const contentWrapper = document.getElementById('mypageContent');
  let currentUserId = null;
  let favoriteRecipes = [];
  let favoriteIds = new Set();

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function showGuestView() {
    if (contentWrapper) contentWrapper.style.display = 'none';
    if (guardElement) guardElement.hidden = false;
  }

  function showContentView() {
    if (contentWrapper) contentWrapper.style.display = '';
    if (guardElement) guardElement.hidden = true;
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

    values.forEach(item => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient';
      ingredientDiv.innerHTML = `
        <span class="name">${item.ingredient}</span>
        <span class="badge" style="background: #f3f4f6; color: #6b7280;">${item.category || '재료'}</span>
      `;
      ingredientsContainer.appendChild(ingredientDiv);
    });
  }

  function renderUser(user, ownedIngredients = []) {
    if (usernameElement) {
      usernameElement.textContent = `${user.username}님!`;
    }

    renderTags(allergyTags, user.allergies || [], '설정된 알레르기가 없습니다.');
    renderTags(categoryTags, user.ingredients || [], '설정된 선호 카테고리가 없습니다.', 'category-tag');
    renderIngredients(ownedIngredients);
  }

  function renderFavoritePreview(recipes = []) {
    if (!recipeContainer) return;
    recipeContainer.innerHTML = '';

    if (!recipes.length) {
      recipeContainer.innerHTML = '<div class="recipe-empty-state">즐겨찾기한 레시피가 없습니다.</div>';
      return;
    }

    recipes.slice(0, 4).forEach(recipe => {
      const card = createRecipeBlock({ ...recipe, bookmarked: true });
      recipeContainer.appendChild(card);
    });

    attachBookmarkListeners(handleBookmarkToggle);
  }

  async function loadFavorites(userId) {
    if (!recipeContainer) return;
    currentUserId = userId;
    recipeContainer.innerHTML = '<div class="recipe-empty-state">즐겨찾기를 불러오는 중...</div>';
    try {
      const { favorites } = await window.apiClient.fetchFavorites(userId);
      favoriteIds = new Set((favorites || []).map(String));

      if (!favoriteIds.size) {
        favoriteRecipes = [];
        renderFavoritePreview([]);
        return;
      }

      const recipesResponse = await window.apiClient.fetchRecipes({ ids: [...favoriteIds].join(',') });
      favoriteRecipes = (recipesResponse.recipes || []).map(window.apiClient.normalizeRecipeForCards).map(r => ({
        ...r,
        bookmarked: true,
      }));
      renderFavoritePreview(favoriteRecipes);
    } catch (err) {
      console.error(err);
      recipeContainer.innerHTML = '<div class="recipe-empty-state" style="color:#cc0000;">즐겨찾기를 불러오지 못했습니다.</div>';
    }
  }

  async function handleBookmarkToggle(recipeId, shouldBookmark) {
    if (!currentUserId) return;

    try {
      if (shouldBookmark) {
        await window.apiClient.addFavoriteApi(currentUserId, recipeId);
        favoriteIds.add(String(recipeId));
      } else {
        await window.apiClient.removeFavoriteApi(currentUserId, recipeId);
        favoriteIds.delete(String(recipeId));
        favoriteRecipes = favoriteRecipes.filter(recipe => String(recipe.id) !== String(recipeId));
      }

      renderFavoritePreview(favoriteRecipes);
    } catch (err) {
      console.error(err);
      showToastNotification('즐겨찾기 상태를 업데이트하지 못했습니다.');
      await loadFavorites(currentUserId);
    }
  }

  async function loadPage() {
    const stored = getStoredUser();
    if (!stored) {
      showGuestView();
      return;
    }

    showContentView();
    try {
      const response = await window.apiClient.fetchUserApi(stored.id);
      if (!response?.user) throw new Error('사용자 정보를 불러오지 못했습니다.');
      const user = response.user;
      localStorage.setItem('currentUser', JSON.stringify(user));

      const ingredientsResponse = await window.apiClient.fetchUserIngredientsApi(user.id);
      const ownedIngredients = ingredientsResponse.ingredients || [];

      renderUser(user, ownedIngredients);
      await loadFavorites(user.id);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('currentUser');
      showGuestView();
    }
  }

  loadPage();
});
