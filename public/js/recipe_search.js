// 메인 입력 필드 변수를 스크립트 최상단에서 정의
const ingredientInput = document.getElementById('ingredientInput');
const excludeInput = document.getElementById('excludeInput');

// 띄어쓰기를 쉼표로 변환하여 검색어를 정돈하는 함수
function autoFormatIngredients(event) {
  const input = event.target;
  let value = input.value.trim();
  
  // 1. 다중 공백을 단일 공백으로 치환
  value = value.replace(/\s{2,}/g, ' ');

  // 2. 쉼표(,)를 기준으로 이미 분리된 경우, 쉼표 주변의 불필요한 공백만 제거
  if (value.includes(',')) {
    value = value.split(',').map(term => term.trim()).join(',');
  } else {
    // 3. 쉼표가 없는 경우, 공백을 쉼표(,)로 치환
    value = value.replace(/\s/g, ',');
  }

  // 4. 연속된 쉼표 제거
  value = value.replace(/,+/g, ',');

  // 5. 앞뒤 쉼표 제거
  value = value.replace(/^,/, '').replace(/,$/, '');
  
  // 입력 필드에 적용
  input.value = value;
}

// 최근 검색어 불러오기 (개별 재료를 태그로 분리하여 표시)
function loadRecentSearches() {
  const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  const recentSection = document.getElementById('recentSection');
  const recentTags = document.getElementById('recentTags');
  
  if (!recentTags || !recentSection) return;
  
  recentTags.innerHTML = '';
  
  // Top 5 검색 항목에서 모든 재료를 추출하고 중복 제거
  const uniqueIngredients = new Set();
  recentSearches.slice(0, 5).forEach(searchEntry => {
      searchEntry.split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
                  .forEach(ing => uniqueIngredients.add(ing));
  });

  const ingredientsToDisplay = Array.from(uniqueIngredients);

  // 검색 기록이 없으면 섹션을 숨김 처리
  if (ingredientsToDisplay.length === 0) {
    recentSection.style.display = 'none';
    return;
  }
  
  // 검색 기록이 있을 때만 섹션을 표시
  recentSection.style.display = 'flex'; 

  ingredientsToDisplay.forEach(ingredient => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.style.cursor = 'pointer';
    tag.innerHTML = `
      ${ingredient}
      <button class="tag-close" data-search="${ingredient}">×</button>
    `;
    
    // 태그 클릭 시 해당 재료로 재검색
    tag.addEventListener('click', (e) => {
      // close 버튼 클릭은 제외
      if (!e.target.classList.contains('tag-close')) {
        ingredientInput.value = ingredient;
        document.getElementById('searchButton').click();
      }
    });
    recentTags.appendChild(tag);
  });
}

// 최근 검색어 저장
function saveRecentSearch(searchTerm) {
  if (!searchTerm) return;

  let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  
  // 중복 제거
  recentSearches = recentSearches.filter(term => term !== searchTerm);
  
  // 맨 앞에 추가
  recentSearches.unshift(searchTerm);
  
  // 최대 10개만 저장
  if (recentSearches.length > 10) {
    recentSearches = recentSearches.slice(0, 10);
  }
  
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  loadRecentSearches();
}

// 페이지 로드 시 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
  // 입력 필드를 벗어날 때(blur) 자동 정돈 기능 추가
  if (ingredientInput) {
    ingredientInput.addEventListener('blur', autoFormatIngredients);
  }
  if (excludeInput) {
    excludeInput.addEventListener('blur', autoFormatIngredients);
  }

  // DOM 로드 완료 후 최근 검색어 태그 로드하여 표시
  loadRecentSearches();
});

// ========== 헤더 검색 기능 ==========
const headerSearchInput = document.getElementById('headerSearchInput');
const headerSearchIcon = document.getElementById('headerSearchIcon');

function performHeaderSearch() {
  const searchQuery = headerSearchInput.value.trim();
  
  if (!searchQuery) {
    alert('검색어를 입력해 주세요.');
    if (headerSearchInput) headerSearchInput.focus();
    return;
  }
  
  // 헤더 검색 시에도 최근 검색어 저장
  saveRecentSearch(searchQuery);

  window.location.href = `recipe_results.html?query=${encodeURIComponent(searchQuery)}`;
}

// handleSearch 함수 정의 (HTML에서 호출)
function handleSearch() {
  performHeaderSearch();
}

// Enter 키로 검색
if (headerSearchInput) {
  headerSearchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performHeaderSearch();
    }
  });
}

// 검색 아이콘 클릭
if (headerSearchIcon) {
  headerSearchIcon.addEventListener('click', performHeaderSearch);
}
  
// ========== 재료 입력 클리어 기능 ==========
const clearIngredientBtn = document.getElementById('clearIngredientBtn');

if (clearIngredientBtn) {
  clearIngredientBtn.addEventListener('click', function() {
    ingredientInput.value = '';
    ingredientInput.focus();
  });
}
  
// ========== 제외 재료 입력 클리어 기능 ==========
const clearExcludeBtn = document.getElementById('clearExcludeBtn');

if (clearExcludeBtn) {
  clearExcludeBtn.addEventListener('click', function() {
    excludeInput.value = '';
    excludeInput.focus();
  });
}
  
// ========== 태그 삭제 기능 ==========
const tagContainer = document.getElementById('recentTags');

if (tagContainer) {
  tagContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('tag-close')) {
      e.stopPropagation(); // 태그 클릭 이벤트 방지
      
      const searchTerm = e.target.getAttribute('data-search');
      
      // localStorage에서 해당 검색어를 포함하는 모든 항목 삭제
      let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      recentSearches = recentSearches.filter(term => {
        // 단일 검색어이거나, 쉼표로 구분된 검색어 목록에서 해당 검색어 제거
        const terms = term.split(',').map(s => s.trim());
        return !terms.includes(searchTerm);
      });
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
      
      // 애니메이션 적용 후 DOM에서 제거
      const tag = e.target.parentElement;
      tag.style.transition = 'opacity 0.3s, transform 0.3s';
      tag.style.opacity = '0';
      tag.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        tag.remove();
        loadRecentSearches(); 
      }, 300);
    }
  });
}
  
// ========== 검색 버튼 클릭 ==========
const searchButton = document.getElementById('searchButton');

if (searchButton) {
  searchButton.addEventListener('click', function() {
    // 검색 버튼 클릭 직전에 입력 내용 자동 정돈
    autoFormatIngredients({ target: ingredientInput });
    autoFormatIngredients({ target: excludeInput });

    const ingredients = ingredientInput.value.trim();
    const excludes = excludeInput.value.trim();
    
    if (!ingredients) {
      alert('검색어를 입력해 주세요.');
      ingredientInput.focus();
      return;
    }
    
    // 검색어 저장 및 목록 업데이트
    saveRecentSearch(ingredients);

    // 검색 실행
    const params = new URLSearchParams();
    params.append('ingredients', ingredients);
    if (excludes) {
      params.append('exclude', excludes);
    }
    
    window.location.href = `recipe_results.html?${params.toString()}`; 
  });
}

// Enter 키로도 검색 가능
if (ingredientInput) {
  ingredientInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
}

if (excludeInput) {
  excludeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
}