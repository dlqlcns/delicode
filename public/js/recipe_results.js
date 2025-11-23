// ============================================
// recipe_results.js - 검색 결과 페이지 (통합 알림 버전)
// ============================================
// ⚠️ recipe_res_block.js를 먼저 로드해야 함!

// 샘플 레시피 데이터
const sampleRecipes = [
  {
    id: 'kimchi_jjigae',
    name: "김치찌개",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop",
    time: "30분",
    description: "매콤하고 시원한 국물이 일품인 한국의 대표 찌개",
    category: "한식",
    bookmarked: false
  },
  {
    id: 'cream_pasta',
    name: "크림 파스타",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    time: "20분",
    description: "부드럽고 고소한 크림 소스가 면발과 완벽하게 어우러진 파스타",
    category: "양식",
    bookmarked: false
  },
  {
    id: 'ramen',
    name: "일본식 라멘",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    time: "45분",
    description: "진한 돈코츠 육수에 탱탱한 면발이 일품인 일본식 라멘",
    category: "일식",
    bookmarked: false
  },
  {
    id: 'chocolate_cake',
    name: "초콜릿 케이크",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    time: "60분",
    description: "촉촉하고 진한 초콜릿 풍미가 가득한 케이크",
    category: "디저트",
    bookmarked: false
  },
  {
    id: 'grilled_salad',
    name: "그릴 샐러드",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    time: "15분",
    description: "신선한 채소와 건강한 드레싱으로 만든 샐러드",
    category: "샐러드",
    bookmarked: false
  },
  {
    id: 'homemade_pizza',
    name: "수제 피자",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    time: "40분",
    description: "바삭한 도우 위에 신선한 토핑이 가득한 수제 피자",
    category: "양식",
    bookmarked: false
  },
  {
    id: 'pu_phat_pong_kari',
    name: "푸팟퐁커리",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop",
    time: "25분",
    description: "부드러운 게살과 코코넛 밀크 커리가 조화로운 태국 요리",
    category: "동남아",
    bookmarked: false
  },
  {
    id: 'pumpkin_soup',
    name: "단호박 수프",
    image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop",
    time: "35분",
    description: "달콤하고 부드러운 단호박을 갈아 만든 건강 수프",
    category: "양식",
    bookmarked: false
  }
];

// 현재 표시 중인 레시피
let currentRecipes = [...sampleRecipes];

const recipeList = document.getElementById('recipeList');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');


// ============================================
// 즐겨찾기 로드
// ============================================

function loadFavorites() {
    const favs = JSON.parse(localStorage.getItem("favorites")) || [];

    sampleRecipes.forEach(recipe => {
        recipe.bookmarked = favs.includes(recipe.id);
    });
}


// ============================================
// 태그 생성
// ============================================

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

    return tag;
}


// ============================================
// 태그 표시
// ============================================

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


// ============================================
// 레시피 렌더링
// ============================================

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
        recipeList.appendChild(createRecipeBlock(recipe));
    });

    attachBookmarkListeners(handleBookmarkClick);
}


// ============================================
// 즐겨찾기 토글 핸들러 (통합 알림 적용)
// ============================================

function handleBookmarkClick(id) {
    const idx = sampleRecipes.findIndex(r => r.id === id);
    if (idx < 0) return;

    sampleRecipes[idx].bookmarked = !sampleRecipes[idx].bookmarked;
    const isBookmarked = sampleRecipes[idx].bookmarked;
    const recipeName = sampleRecipes[idx].name;

    // 저장
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    if (isBookmarked) {
        if (!favs.includes(id)) favs.push(id);
    } else {
        favs = favs.filter(v => v !== id);
    }
    localStorage.setItem("favorites", JSON.stringify(favs));

    // 정렬이 인기순인 경우 재렌더링
    const needsFullRerender = sortSelect && sortSelect.value === "인기순";

    if (needsFullRerender) {
        filterAndRenderResults();
    } else {
        const btn = document.querySelector(`.bookmark-btn[data-bookmark-id="${id}"]`);
        if (btn) {
            btn.textContent = isBookmarked ? '♥' : '♡';
            btn.classList.toggle('active', isBookmarked);
        }
    }

    // =====================================
    //  🔔 통합된 showToastNotification 적용 (recipe_res_block.js에서 가져옴)
    // =====================================

    if (isBookmarked) {
        showToastNotification(
            `"${recipeName}"이(가) 즐겨찾기에 추가되었습니다.`,
            "이동",
            () => { window.location.href = "my_fav.html"; }
        );
    } else {
        showToastNotification(
            `"${recipeName}"이(가) 즐겨찾기에서 해제되었습니다.`
        );
    }
}


// ============================================
// 필터링 및 정렬
// ============================================

function filterAndRenderResults() {
    const urlParams = new URLSearchParams(window.location.search);

    const query = urlParams.get('query') || '';
    const ingredientsString = urlParams.get('ingredients') || '';
    const excludeString = urlParams.get('exclude') || '';

    const selectedCategory = categorySelect?.value || '전체';
    const sortOption = sortSelect?.value || '최신 등록순';

    let searchTerms = ingredientsString.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    if (query.trim() !== '') searchTerms.push(query.trim().toLowerCase());
    searchTerms = [...new Set(searchTerms)];

    let excludeTerms = excludeString.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    let filtered = [...sampleRecipes];

    // 포함 검색
    if (searchTerms.length > 0) {
        filtered = filtered.filter(r => {
            const text = `${r.name} ${r.category} ${r.description}`.toLowerCase();
            return searchTerms.some(term => text.includes(term));
        });
    }

    // 제외 검색
    if (excludeTerms.length > 0) {
        filtered = filtered.filter(r => {
            const text = `${r.name} ${r.category} ${r.description}`.toLowerCase();
            return !excludeTerms.some(term => text.includes(term));
        });
    }

    // 카테고리 필터
    if (selectedCategory !== "전체") {
        filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // 정렬
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
        case '최신순':
        case '최근 등록순':
        default:
            filtered.sort((a, b) => (a.id < b.id ? 1 : -1));
            break;
    }

    currentRecipes = filtered;
    renderRecipes(filtered);
}


// ============================================
// DOMContentLoaded
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    loadFavorites();

    const urlParams = new URLSearchParams(window.location.search);

    displayTags(urlParams);
    filterAndRenderResults();

    const tagContainer = document.getElementById("tagContainer");

    if (tagContainer) {
        tagContainer.addEventListener('click', function(e) {
            if (!e.target.classList.contains('tag-close')) return;

            e.stopPropagation();

            const tag = e.target.closest('.tag');
            const type = tag.dataset.type;
            const value = tag.dataset.value;

            tag.style.opacity = '0';
            tag.style.transform = 'scale(0.8)';
            setTimeout(() => tag.remove(), 300);

            let newParams = new URLSearchParams(window.location.search);

            if (type === 'query') {
                newParams.delete('query');
            } else if (type === 'ingredients') {
                const items = (newParams.get('ingredients') || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s && s !== value);

                if (items.length > 0) {
                    newParams.set('ingredients', items.join(','));
                } else {
                    newParams.delete('ingredients');
                }
            }

            const hasQuery = newParams.has('query') && newParams.get('query').trim() !== '';
            const hasIng = newParams.has('ingredients') && newParams.get('ingredients').trim() !== '';

            if (!hasQuery && !hasIng) {
                window.location.href = "recipe_all.html";
                return;
            }

            const newUrl = newParams.toString()
                ? `${window.location.pathname}?${newParams.toString()}`
                : window.location.pathname;

            history.replaceState(null, '', newUrl);

            displayTags(newParams);
            filterAndRenderResults();
        });
    }


    // 헤더 검색 기능
    const headerSearchInput = document.getElementById("headerSearchInput");
    if (headerSearchInput) {
        headerSearchInput.addEventListener("keypress", e => {
            if (e.key !== "Enter") return;

            const query = headerSearchInput.value.trim();
            if (!query) return;

            let recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');

            recent = recent.filter(q => q !== query);
            recent.unshift(query);

            if (recent.length > 10) recent = recent.slice(0, 10);

            localStorage.setItem('recentSearches', JSON.stringify(recent));

            const ing = query.replace(/\s+/g, ',');
            window.location.href = `recipe_results.html?ingredients=${encodeURIComponent(ing)}`;
        });
    }


    if (categorySelect) {
        categorySelect.addEventListener('change', filterAndRenderResults);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndRenderResults);
    }
});