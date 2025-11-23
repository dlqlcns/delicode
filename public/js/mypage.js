// ===========================================
// mypage.js - 사용자 정보 연동 버전
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================
  // recipe_all.js와 동일한 레시피 데이터베이스
  // ============================================
  const RECIPES_DATABASE = [
    { id: 'kimchi_jjigae', name: "김치찌개", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop", time: "30분", description: "매콤하고 시원한 국물이 일품인 한국의 대표 찌개", category: "한식", bookmarked: false },
    { id: 'cream_pasta', name: "크림 파스타", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop", time: "20분", description: "부드럽고 고소한 크림 소스가 면발과 완벽하게 어우러진 파스타", category: "양식", bookmarked: false },
    { id: 'ramen', name: "일본식 라멘", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", time: "45분", description: "진한 돈코츠 육수에 탱탱한 면발이 일품인 일본식 라멘", category: "일식", bookmarked: false },
    { id: 'chocolate_cake', name: "초콜릿 케이크", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", time: "60분", description: "촉촉하고 진한 초콜릿 풍미가 가득한 케이크", category: "디저트", bookmarked: false },
    { id: 'grilled_salad', name: "그릴 샐러드", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", time: "15분", description: "신선한 채소와 건강한 드레싱으로 만든 샐러드", category: "샐러드", bookmarked: false },
    { id: 'homemade_pizza', name: "수제 피자", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop", time: "40분", description: "바삭한 도우 위에 신선한 토핑이 가득한 수제 피자", category: "양식", bookmarked: false },
    { id: 'pu_phat_pong_kari', name: "푸팟퐁커리", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop", time: "25분", description: "부드러운 게살과 코코넛 밀크 커리가 조화로운 태국 요리", category: "동남아", bookmarked: false },
    { id: 'pumpkin_soup', name: "단호박 수프", image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop", time: "35분", description: "달콤하고 부드러운 단호박을 갈아 만든 건강 수프", category: "양식", bookmarked: false }
  ];

  const container = document.getElementById("recipeContainer");

  // ============================================
  // 사용자 정보 표시
  // ============================================
  function displayUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 사용자 이름 표시
    const usernameElement = document.querySelector('.profile-card .username');
    if (usernameElement && currentUser) {
      usernameElement.textContent = `${currentUser.name}님!`;
    }
    
    // 알레르기 정보 표시
    const allergyTags = document.querySelector('.allergy-card .tags');
    if (allergyTags && currentUser && currentUser.allergies) {
      allergyTags.innerHTML = '';
      
      if (currentUser.allergies.length === 0) {
        allergyTags.innerHTML = '<p style="color: #495565; font-size: 14px;">설정된 알레르기가 없습니다.</p>';
      } else {
        currentUser.allergies.forEach(allergy => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = allergy;
          allergyTags.appendChild(tag);
        });
      }
    }
    
    // 선호 카테고리 표시
    const categoryTags = document.querySelector('.category-card .tags');
    if (categoryTags && currentUser && currentUser.preferences) {
      categoryTags.innerHTML = '';
      
      if (currentUser.preferences.length === 0) {
        categoryTags.innerHTML = '<p style="color: #495565; font-size: 14px;">설정된 선호 카테고리가 없습니다.</p>';
      } else {
        currentUser.preferences.forEach(category => {
          const tag = document.createElement('span');
          tag.className = 'category-tag';
          tag.textContent = category;
          categoryTags.appendChild(tag);
        });
      }
    }
    
    // ===== 보유 재료 표시 =====
    const ingredientsContainer = document.querySelector('.ingredients');
    if (ingredientsContainer && currentUser && currentUser.ingredients) {
      ingredientsContainer.innerHTML = '';
      
      // 카테고리별로 재료 표시
      const categoryColors = {
        '채소류': { bgColor: '#b8f7cf', textColor: '#008235', label: '채소' },
        '육류': { bgColor: '#ffe2e2', textColor: '#c10007', label: '육류' },
        '유제품': { bgColor: '#bddaff', textColor: '#1347e5', label: '유제품' },
        '곡물류': { bgColor: '#fff4d6', textColor: '#8b6914', label: '곡물' },
        '기타': { bgColor: '#f3f4f6', textColor: '#6b7280', label: '기타' },
        '전체': { bgColor: '#f3f4f6', textColor: '#6b7280', label: '전체' }
      };
      
      let hasIngredients = false;
      
      for (const category in currentUser.ingredients) {
        const ingredientList = currentUser.ingredients[category];
        const colorInfo = categoryColors[category] || categoryColors['기타'];
        
        ingredientList.forEach(name => {
          hasIngredients = true;
          const ingredientDiv = document.createElement('div');
          ingredientDiv.className = 'ingredient';
          ingredientDiv.innerHTML = `
            <span class="name">${name}</span>
            <span class="badge" style="background: ${colorInfo.bgColor}; color: ${colorInfo.textColor};">
              ${colorInfo.label}
            </span>
          `;
          ingredientsContainer.appendChild(ingredientDiv);
        });
      }
      
      // 재료가 없는 경우
      if (!hasIngredients) {
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
      }
    } else if (ingredientsContainer) {
      // currentUser가 없거나 ingredients가 없는 경우
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
    }
  }

  // ============================================
  // localStorage에서 즐겨찾기 ID 목록 가져오기
  // ============================================
  function getFavoriteIds() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  }

  // ============================================
  // localStorage에 즐겨찾기 ID 저장
  // ============================================
  function saveFavoriteIds(ids) {
    localStorage.setItem("favorites", JSON.stringify(ids));
  }

  // ============================================
  // 즐겨찾기된 레시피만 필터링 (최신순)
  // ============================================
  function getFavoriteRecipes() {
    const favoriteIds = getFavoriteIds();
    
    // 즐겨찾기된 레시피만 추출
    const favorited = RECIPES_DATABASE.filter(r => favoriteIds.includes(r.id));
    
    // 최신순 정렬 (favoriteIds 배열 순서대로 = 최근에 추가된 순)
    favorited.sort((a, b) => {
      return favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id);
    });
    
    return favorited;
  }

  // ============================================
  // 레시피 블록 생성 함수
  // ============================================
  function createRecipeBlock(recipe) {
    const block = document.createElement('article');
    block.className = 'recipe-res-block';

    block.innerHTML = `
      <a href="recipe_detail.html?id=${recipe.id}" class="recipe-link">
        <div class="recipe-image-box" style="background-image: url('${recipe.image}');">
          <button class="bookmark-btn bookmarked" 
                  data-id="${recipe.id}" 
                  aria-label="북마크 해제">
            ♥
          </button>
        </div>

        <div class="recipe-content">
          <h3 class="recipe-title">${recipe.name}</h3>
          <p class="recipe-category">${recipe.category}</p>
          <p class="recipe-desc-short">${recipe.description}</p>
          <div class="recipe-time">
            <img src="아이콘/timer.png" alt="시간" class="time-icon" />
            <span>${recipe.time}</span>
          </div>
        </div>
      </a>
    `;
    
    return block;
  }

  // ============================================
  // 북마크 토글 (해제 기능)
  // ============================================
  function toggleBookmark(recipeId) {
    let favoriteIds = getFavoriteIds();
    
    // 레시피 이름 가져오기 (알림용)
    const recipe = RECIPES_DATABASE.find(r => r.id === recipeId);
    const recipeName = recipe ? recipe.name : "레시피";
    
    // 이미 즐겨찾기된 상태 → 해제
    favoriteIds = favoriteIds.filter(id => id !== recipeId);
    saveFavoriteIds(favoriteIds);
    
    // 화면 다시 렌더링
    renderRecipes();
    
    console.log(`"${recipeName}" 즐겨찾기 해제됨`);
  }

  // ============================================
  // 북마크 클릭 이벤트 연결
  // ============================================
  function attachBookmarkListeners() {
    document.querySelectorAll('.bookmark-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const recipeId = e.currentTarget.dataset.id;
        toggleBookmark(recipeId);
      });
    });
  }

  // ============================================
  // 레시피 렌더링 (최대 4개만 표시)
  // ============================================
  function renderRecipes() {
    if (!container) return;
    
    container.innerHTML = '';
    
    const favoriteRecipes = getFavoriteRecipes();
    
    // 즐겨찾기가 없는 경우
    if (favoriteRecipes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
          <p>즐겨찾기한 레시피가 없습니다.</p>
          <p style="font-size: 14px; margin-top: 8px;">
            <a href="recipe_all.html" style="color: #3459ff; text-decoration: underline;">
              레시피 둘러보기
            </a>
          </p>
        </div>
      `;
      return;
    }
    
    // 최대 4개만 표시 (마이페이지 미리보기)
    const displayRecipes = favoriteRecipes.slice(0, 4);
    
    displayRecipes.forEach(recipe => {
      const card = createRecipeBlock(recipe);
      container.appendChild(card);
    });

    attachBookmarkListeners();
  }

  // ============================================
  // 초기 렌더링
  // ============================================
  displayUserInfo();
  renderRecipes();

});