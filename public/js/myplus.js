// myplus.js

// 로컬 스토리지 키
const STORAGE_KEY = 'userIngredients';

// 요소 가져오기
const input = document.querySelector(".add-row .input"); // 입력창
const select = document.querySelector(".add-row .select"); // 카테고리 선택
const addBtn = document.querySelector(".btn-add"); // 추가 버튼
const saveBtn = document.querySelector(".btn-save"); // 저장 버튼
const ingredientSection = document.querySelector(".ingredient-section"); // 재료 카테고리 묶음

// ✅ 수정된 카테고리 목록
const CATEGORIES = ['전체', '채소류', '육류', '유제품', '곡물류', '기타'];

// 초기 카테고리 선택(select) 옵션 생성
function createCategoryOptions() {
    select.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// 재료 수 업데이트 함수
function updateCount() {
    const countP = document.querySelectorAll(".card .section-header p")[1];
    const totalBadges = document.querySelectorAll(".ingredient-section .badge").length;
    countP.textContent = `총 ${totalBadges}개의 재료가 등록되어 있습니다`;

    // 재료가 0개면 화면에 보이는 모든 카테고리 영역을 제거
    if (totalBadges === 0) {
        ingredientSection.innerHTML = '';
    }
}

// ✅ 카테고리 영역을 동적으로 생성/가져오는 함수
function getOrCreateCategoryElement(categoryName) {
    let target = document.querySelector(`.category[data-category="${categoryName}"]`);
    
    // 해당 카테고리 영역이 없다면 생성
    if (!target) {
        target = document.createElement('div');
        target.className = 'category';
        target.setAttribute('data-category', categoryName); // 데이터 속성 추가
        target.innerHTML = `
            <h3>${categoryName}</h3>
            <div class="badge-wrap"></div>
        `;
        // 카테고리를 순서에 맞게 삽입 (선택 사항이지만, 깔끔하게 보이기 위해)
        let inserted = false;
        const existingCategories = Array.from(ingredientSection.children);
        const categoryIndex = CATEGORIES.indexOf(categoryName);
        
        for (let i = 0; i < existingCategories.length; i++) {
            const existingCatName = existingCategories[i].getAttribute('data-category');
            const existingIndex = CATEGORIES.indexOf(existingCatName);
            
            if (categoryIndex < existingIndex) {
                ingredientSection.insertBefore(target, existingCategories[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            ingredientSection.appendChild(target);
        }
    }
    return target;
}

// ✅ 재료 추가 함수 (중복 체크 및 동적 카테고리 생성 포함)
function addIngredient(name, categoryName) {
    // 1. 중복 확인 (화면에 있는 모든 뱃지 대상)
    const existingBadges = document.querySelectorAll(".ingredient-section .badge");
    for (const badge of existingBadges) {
        // 뱃지 텍스트에서 닫기 버튼 텍스트(×)를 제외하고 비교
        const badgeName = badge.textContent.replace('×', '').trim();
        if (badgeName === name) {
            alert(`'${name}'은(는) 이미 등록된 재료입니다.`);
            return false; // 추가 실패
        }
    }

    // 2. 카테고리 영역 가져오기 또는 생성
    const target = getOrCreateCategoryElement(categoryName);
    const wrap = target.querySelector(".badge-wrap");

    // 3. 새로운 뱃지(태그) 생성 (recipe_results 스타일 사용)
    const badge = document.createElement("div");
    badge.className = "badge"; 
    // 닫기 버튼은 <button> 태그를 사용 (클릭 영역 및 접근성 개선)
    badge.innerHTML = `${name} <button class="badge-close" type="button">×</button>`; 

    wrap.appendChild(badge);
    updateCount();
    return true; // 추가 성공
}

// ✅ 재료 정보를 로컬 스토리지에 저장 (mypage 연동 추가)
function saveIngredients() {
    const data = {};
    const categoriesOnScreen = document.querySelectorAll('.ingredient-section .category');
    
    categoriesOnScreen.forEach(categoryEl => {
        const categoryName = categoryEl.getAttribute('data-category');
        const badges = categoryEl.querySelectorAll('.badge');
        
        const ingredients = Array.from(badges).map(badge => {
            // 뱃지 텍스트에서 닫기 버튼 텍스트(×)를 제외하고 재료 이름만 추출
            return badge.textContent.replace('×', '').trim();
        });
        
        if (ingredients.length > 0) {
            data[categoryName] = ingredients;
        }
    });

    // localStorage에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // currentUser에도 저장 (mypage 연동)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        currentUser.ingredients = data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // userList도 업데이트
        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        const idx = userList.findIndex(u => u.userId === currentUser.userId);
        if (idx !== -1) {
            userList[idx] = currentUser;
            localStorage.setItem('userList', JSON.stringify(userList));
        }
    }
    
    alert('보유 재료 목록이 저장되었습니다.');
    
    // 저장 성공 후 mypage로 이동
    window.location.href = 'mypage.html';
}

// ✅ 로컬 스토리지에서 재료를 로드하여 화면에 표시 (currentUser 우선)
function loadIngredients() {
    // 1. 카테고리 select 옵션 생성
    createCategoryOptions();

    // 2. currentUser에서 먼저 로드 시도
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let ingredients = {};
    
    if (currentUser && currentUser.ingredients) {
        ingredients = currentUser.ingredients;
    } else {
        // currentUser에 없으면 기존 STORAGE_KEY에서 로드
        const savedData = localStorage.getItem(STORAGE_KEY);
        ingredients = savedData ? JSON.parse(savedData) : {};
    }

    // 3. 화면 초기화 (모든 카테고리 영역 제거)
    ingredientSection.innerHTML = ''; 

    // 4. 저장된 재료 렌더링
    for (const category in ingredients) {
        if (ingredients[category] && ingredients[category].length > 0) {
            const target = getOrCreateCategoryElement(category); // 카테고리 영역 동적 생성
            const wrap = target.querySelector(".badge-wrap");
            
            ingredients[category].forEach(name => {
                const badge = document.createElement("div");
                badge.className = "badge"; 
                badge.innerHTML = `${name} <button class="badge-close" type="button">×</button>`;
                wrap.appendChild(badge);
            });
        }
    }
    
    // 5. 재료 수 업데이트 (저장된 재료가 없으면 총 0개로 표시되고 화면은 비어 있음)
    updateCount();
}

// ==========================================================
// 이벤트 리스너
// ==========================================================

// '추가' 버튼 클릭 이벤트
addBtn.addEventListener("click", () => {
    const name = input.value.trim();
    const category = select.value;

    if (!name) {
        alert("재료 이름을 입력하세요!");
        return;
    }

    if (addIngredient(name, category)) {
        input.value = ""; // 입력 초기화
        input.focus();
    }
});

// 엔터 키로 재료 추가
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // 폼 제출 방지
        addBtn.click();
    }
});

// '저장' 버튼 클릭 이벤트
saveBtn.addEventListener("click", saveIngredients);

// 재료 삭제 기능
document.addEventListener("click", (e) => {
    // 닫기 버튼(badge-close) 클릭 시
    if (e.target.classList.contains("badge-close")) {
        const badge = e.target.closest(".badge");
        if (badge) {
            const wrap = e.target.closest('.badge-wrap');
            const categoryEl = e.target.closest('.category');
            
            badge.remove();
            
            // 뱃지 제거 후 해당 카테고리에 남은 재료가 없으면 카테고리 영역도 제거
            if (wrap.children.length === 0) {
                categoryEl.remove();
            }

            updateCount();
        }
    }
});

// 페이지 로드 시 초기 재료 로드 및 화면 초기화
loadIngredients();

// ===========================================
// [추가] 헤더 검색 (headerSearchInput) Enter 키 이벤트 리스너
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ 헤더 검색 입력 필드
    const headerSearchInput = document.getElementById("headerSearchInput");

    if (headerSearchInput) {
        headerSearchInput.addEventListener("keypress", e => {
            // Enter 키 감지
            if (e.key === "Enter") {
                const query = headerSearchInput.value.trim();
                
                if (query) {
                    // 최근 검색어 로직
                    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
                    recentSearches = recentSearches.filter(term => term !== query);
                    recentSearches.unshift(query);
                    if (recentSearches.length > 10) {
                        recentSearches = recentSearches.slice(0, 10);
                    }
                    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
                    
                    // 검색 결과 페이지로 이동
                    const ingredients = query.replace(/\s+/g, ',');
                    window.location.href = `recipe_results.html?ingredients=${encodeURIComponent(ingredients)}`;
                }
            }
        });
    }
});