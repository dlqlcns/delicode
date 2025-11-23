// ============================================
// recipe_all.js - 전체 레시피 페이지 (알림 스타일 통합됨)
// ============================================
// ⚠️ recipe_res_block.js가 먼저 로드되어야 합니다.

const sampleRecipes = [
  { id: 'kimchi_jjigae', name: "김치찌개", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop", time: "30분", description: "매콤하고 시원한 국물이 일품인 한국의 대표 찌개", category: "한식", bookmarked: false },
  { id: 'cream_pasta', name: "크림 파스타", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop", time: "20분", description: "부드럽고 고소한 크림 소스가 면발과 완벽하게 어우러진 파스타", category: "양식", bookmarked: false },
  { id: 'ramen', name: "일본식 라멘", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", time: "45분", description: "진한 돈코츠 육수에 탱탱한 면발이 일품인 일본식 라멘", category: "일식", bookmarked: false },
  { id: 'chocolate_cake', name: "초콜릿 케이크", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", time: "60분", description: "촉촉하고 진한 초콜릿 풍미가 가득한 케이크", category: "디저트", bookmarked: false },
  { id: 'grilled_salad', name: "그릴 샐러드", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", time: "15분", description: "신선한 채소와 건강한 드레싱으로 만든 샐러드", category: "샐러드", bookmarked: false },
  { id: 'homemade_pizza', name: "수제 피자", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop", time: "40분", description: "바삭한 도우 위에 신선한 토핑이 가득한 수제 피자", category: "양식", bookmarked: false },
  { id: 'pu_phat_pong_kari', name: "푸팟퐁커리", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop", time: "25분", description: "부드러운 게살과 코코넛 밀크 커리가 조화로운 태국 요리", category: "동남아", bookmarked: false },
  { id: 'pumpkin_soup', name: "단호박 수프", image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop", time: "35분", description: "달콤하고 부드러운 단호박을 갈아 만든 건강 수프", category: "양식", bookmarked: false }
];

let currentRecipes = [...sampleRecipes];

const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');

// 로컬 스토리지 즐겨찾기 상태 로드
function loadFavorites() {
    const favs = JSON.parse(localStorage.getItem("favorites")) || [];
    sampleRecipes.forEach(recipe => {
        recipe.bookmarked = favs.includes(recipe.id);
    });
}

// 렌더링 함수
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

// 북마크 클릭 처리
function onBookmarkClicked(id) {
  const idx = sampleRecipes.findIndex(x => x.id === id);
  if (idx < 0) return;

  // 상태 토글
  sampleRecipes[idx].bookmarked = !sampleRecipes[idx].bookmarked;
  const isBookmarked = sampleRecipes[idx].bookmarked;
  const recipeName = sampleRecipes[idx].name; 

  // 로컬 스토리지 업데이트
  let favs = JSON.parse(localStorage.getItem("favorites")) || [];

  if (isBookmarked) {
    if (!favs.includes(id)) favs.push(id);
  } else {
    favs = favs.filter(favId => favId !== id);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));

  // 정렬 옵션이 '인기순'이면 재정렬
  if (sortSelect && sortSelect.value === '인기순') {
    filterRecipes(); 
  } else {
    // UI 버튼 상태만 업데이트 (재렌더링 방지)
    const btn = document.querySelector(`.bookmark-btn[data-bookmark-id="${id}"]`);
    if (btn) {
        btn.textContent = isBookmarked ? '♥' : '♡';
        btn.classList.toggle('active', isBookmarked);
    }
  }

  // 🔔 통합 알림 표시 (recipe_res_block.js에서 가져온 함수)
  if (isBookmarked) {
    showToastNotification(
        `"${recipeName}"이(가) 즐겨찾기에 추가되었습니다.`,
        "이동",
        () => { window.location.href = "my_fav.html"; }
    );
  } else {
    showToastNotification(`"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`);
  }
}

// 필터 및 정렬 함수
function filterRecipes() {
  const selectedCategory = categorySelect?.value || '전체';
  const sortOption = sortSelect?.value || '최신순';

  let filtered = [...sampleRecipes];
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

if (categorySelect) categorySelect.addEventListener('change', filterRecipes);
if (sortSelect) sortSelect.addEventListener('change', filterRecipes);

document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  renderRecipes();
});