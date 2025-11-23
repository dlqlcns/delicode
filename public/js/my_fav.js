// ===========================================
// my_fav.js - 즐겨찾기 페이지 (알림 스타일 통합됨)
// ===========================================
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!

const sampleRecipes = [
  { id: 'kimchi_jjigae', name: "김치찌개", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop", time: "30분", description: "매콤하고 시원한 국물이 일품인 한국의 대표 찌개", category: "한식", bookmarked: false },
  { id: 'cream_pasta', name: "크림 파스타", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit:crop", time: "20분", description: "부드럽고 고소한 크림 소스가 면발과 완벽하게 어우러진 파스타", category: "양식", bookmarked: false },
  { id: 'ramen', name: "일본식 라멘", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit:crop", time: "45분", description: "진한 돈코츠 육수에 탱탱한 면발이 일품인 일본식 라멘", category: "일식", bookmarked: false },
  { id: 'chocolate_cake', name: "초콜릿 케이크", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit:crop", time: "60분", description: "촉촉하고 진한 초콜릿 풍미가 가득한 케이크", category: "디저트", bookmarked: false },
  { id: 'grilled_salad', name: "그릴 샐러드", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit:crop", time: "15분", description: "신선한 채소와 건강한 드레싱으로 만든 샐러드", category: "샐러드", bookmarked: false },
  { id: 'homemade_pizza', name: "수제 피자", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit:crop", time: "40분", description: "바삭한 도우 위에 신선한 토핑이 가득한 수제 피자", category: "양식", bookmarked: false },
  { id: 'pu_phat_pong_kari', name: "푸팟퐁커리", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit:crop", time: "25분", description: "부드러운 게살과 코코넛 밀크 커리가 조화로운 태국 요리", category: "동남아", bookmarked: false },
  { id: 'pumpkin_soup', name: "단호박 수프", image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit:crop", time: "35분", description: "달콤하고 부드러운 단호박을 갈아 만든 건강 수프", category: "양식", bookmarked: false }
];

let currentRecipes = [];

// DOM 요소
const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const favSearchInput = document.getElementById('favSearchInput');
const favSearchIcon = document.getElementById('favSearchIcon');

// ============================================
// DOMContentLoaded 및 이벤트 리스너
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    filterRecipes(); // 초기 로드

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

function onBookmarkClicked(id) {
    const idx = sampleRecipes.findIndex(x => x.id === id);
    if (idx < 0) return;

    const recipeName = sampleRecipes[idx].name; 
    
    // 데이터 및 로컬 스토리지 업데이트 (제거)
    sampleRecipes[idx].bookmarked = false;
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    favs = favs.filter(favId => favId !== id);
    localStorage.setItem("favorites", JSON.stringify(favs));
    
    // 재렌더링
    filterRecipes(); 
    
    // 통합 알림 표시 (recipe_res_block.js에서 가져온 함수)
    showToastNotification(`"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`);
}

function filterRecipes() {
    const favIds = JSON.parse(localStorage.getItem("favorites")) || [];
    let filtered = sampleRecipes.filter(recipe => favIds.includes(recipe.id));
    
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