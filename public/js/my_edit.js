// ==============================
// my_edit.js
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const allergyCheckboxes = document.querySelectorAll('.allergy-grid input[type="checkbox"]');
  const preferenceCheckboxes = document.querySelectorAll('.preference-grid input[type="checkbox"]');
  const saveBtn = document.querySelector('.save-btn');
  const dangerBtn = document.querySelector('.danger-btn');

  // 로그인된 유저 데이터 불러오기
  function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      location.href = 'login.html';
      return;
    }

    // 이름, 이메일
    nameInput.value = currentUser.name || '';
    emailInput.value = currentUser.email || '';

    // 알레르기 체크박스 적용
    allergyCheckboxes.forEach(cb => {
      cb.checked = currentUser.allergies?.includes(cb.value) || false;
    });

    // 선호 요리 카테고리 체크박스 적용
    preferenceCheckboxes.forEach(cb => {
      cb.checked = currentUser.preferences?.includes(cb.value) || false;
    });
  }

  // 저장 버튼
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) return;

      const newName = nameInput.value.trim();
      const newEmail = emailInput.value.trim();

      if (!newName) {
        alert('이름을 입력해주세요.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        alert('올바른 이메일 형식이 아닙니다.');
        return;
      }

      // 알레르기 수집
      const allergies = [...allergyCheckboxes]
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      // 선호 요리 카테고리 수집
      const preferences = [...preferenceCheckboxes]
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      // currentUser 업데이트
      currentUser.name = newName;
      currentUser.email = newEmail;
      currentUser.allergies = allergies;
      currentUser.preferences = preferences;

      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      // userList도 업데이트
      const userList = JSON.parse(localStorage.getItem('userList')) || [];
      const idx = userList.findIndex(u => u.userId === currentUser.userId);

      if (idx !== -1) {
        userList[idx] = currentUser;
        localStorage.setItem('userList', JSON.stringify(userList));
      }

      alert('프로필이 저장되었습니다.');
      location.href = 'mypage.html';
    });
  }

  // 초기화 버튼
  if (dangerBtn) {
    dangerBtn.addEventListener('click', () => {
      if (!confirm("정말 초기화하시겠습니까?\n알레르기 정보와 선호 카테고리가 모두 삭제됩니다.")) return;

      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        currentUser.allergies = [];
        currentUser.preferences = [];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // userList도 업데이트
        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        const idx = userList.findIndex(u => u.userId === currentUser.userId);
        if (idx !== -1) {
          userList[idx] = currentUser;
          localStorage.setItem('userList', JSON.stringify(userList));
        }
      }

      alert('데이터가 초기화되었습니다.');
      location.reload();
    });
  }

  // 초기 로드
  loadUserData();
});