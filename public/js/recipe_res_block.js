// ============================================
// recipe_res_block.js - 통합 알림 기능 추가 버전
// ============================================

function createRecipeBlock(recipe) {
  const block = document.createElement('article');
  block.className = 'recipe-res-block';

  block.innerHTML = `
    <button class="bookmark-btn ${recipe.bookmarked ? 'active' : ''}" 
            data-bookmark-id="${recipe.id}" aria-label="북마크">
      ${recipe.bookmarked ? '♥' : '♡'}
    </button>

    <a href="recipe_detail.html?id=${recipe.id}" class="recipe-link">
      <div class="recipe-image-box" style="background-image: url('${recipe.image}');"></div>

      <div class="recipe-content">
        <h3 class="recipe-title">${recipe.name}</h3>
        <p class="recipe-category">${recipe.category}</p>
        <p class="recipe-desc-short">${recipe.description}</p>

        <div class="recipe-time">
          <img src="/img/icons/timer.png" alt="시간" class="time-icon" />
          <span>${recipe.time}</span>
        </div>
      </div>
    </a>
  `;

  return block;
}

/* ============================================
   [통합] 공통 토스트 알림 함수 - 화면 정중앙 배치
   - 모든 페이지에서 이 함수를 사용하여 알림을 띄웁니다.
   - message: 알림 텍스트
   - actionText: 버튼 텍스트 (null이면 버튼 없음)
   - actionCallback: 버튼 클릭 시 실행할 함수
   ============================================ */
function showToastNotification(message, actionText = null, actionCallback = null) {
    // 기존 알림이 있다면 제거 (중복 방지)
    const existing = document.getElementById('commonNotification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.id = 'commonNotification';
    
    // 통일된 스타일 (검은색 반투명 배경, 화면 정중앙)
    notif.style.cssText = `
        position: fixed;
        top: 90%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background-color: rgba(33, 33, 33, 0.95);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 14px;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        max-width: 90%;
        width: auto;
    `;
    
    // 메시지 텍스트
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    msgSpan.style.fontWeight = "500";
    notif.appendChild(msgSpan);

    // 액션 버튼 (옵션)
    if (actionText && actionCallback) {
        const actionBtn = document.createElement('button');
        actionBtn.textContent = actionText;
        actionBtn.style.cssText = `
            background-color: #3459ff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 700;
            font-size: 13px;
            transition: background-color 0.2s;
            white-space: nowrap;
        `;
        
        actionBtn.onmouseover = () => actionBtn.style.backgroundColor = "#2347dd";
        actionBtn.onmouseout = () => actionBtn.style.backgroundColor = "#3459ff";
        
        actionBtn.onclick = () => {
            actionCallback();
            removeNotification(notif);
        };
        notif.appendChild(actionBtn);
    }
    
    // 닫기 버튼 (X)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #999;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        margin-left: -8px;
    `;
    closeBtn.onclick = () => removeNotification(notif);
    notif.appendChild(closeBtn);

    document.body.appendChild(notif);

    // 등장 애니메이션 (화면 정중앙에서 확대)
    requestAnimationFrame(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // 5초 후 자동 사라짐
    setTimeout(() => {
        if (document.body.contains(notif)) {
            removeNotification(notif);
        }
    }, 5000);
}

// 알림창 제거 애니메이션
function removeNotification(element) {
    element.style.opacity = '0';
    element.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
        if (element.parentNode) element.remove();
    }, 300);
}

// 기존 showLoginRequestNotification 함수는 이제 showToastNotification을 사용
function showLoginRequestNotification() {
    showToastNotification(
        "로그인이 필요한 서비스입니다.", 
        "로그인 하러가기", 
        () => { window.location.href = "login.html"; }
    );
}


/* ============================================
   북마크 버튼 리스너
   createRecipeBlock()에서 렌더한 DOM에 대해 호출
   ============================================ */
function attachBookmarkListeners(handler) {

  document.querySelectorAll('.bookmark-btn').forEach(btn => {

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 카드 클릭 방지
      e.preventDefault();  // 링크 이동 방지

      // 🔒 로그인 상태 체크
      const currentUser = localStorage.getItem('currentUser');
      
      if (!currentUser || currentUser === 'null' || currentUser === 'undefined') {
        showLoginRequestNotification();
        return; 
      }

      const id = btn.dataset.bookmarkId;

      // UI 즉시 토글
      const isActive = btn.classList.toggle('active');
      btn.textContent = isActive ? '♥' : '♡';

      // 페이지별 핸들러 실행
      if (handler) handler(id);
    });

  });
}