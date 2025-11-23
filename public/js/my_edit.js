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

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  // 로그인된 유저 데이터 불러오기
  async function loadUserData() {
    const stored = getCurrentUser();

    if (!stored) {
      alert('로그인이 필요합니다.');
      location.href = 'login.html';
      return;
    }

    try {
      const response = await window.apiClient.fetchUserApi(stored.id);
      const user = response.user;
      localStorage.setItem('currentUser', JSON.stringify(user));

      nameInput.value = user.username || '';
      emailInput.value = user.email || '';

      allergyCheckboxes.forEach(cb => {
        cb.checked = user.allergies?.includes(cb.value) || false;
      });

      preferenceCheckboxes.forEach(cb => {
        cb.checked = user.ingredients?.includes(cb.value) || false;
      });
    } catch (err) {
      console.error(err);
      alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      location.href = 'login.html';
    }
  }

  // 저장 버튼
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const currentUser = getCurrentUser();
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

      const allergies = [...allergyCheckboxes]
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      const preferences = [...preferenceCheckboxes]
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      try {
        const response = await window.apiClient.updateUserApi(currentUser.id, {
          username: newName,
          email: newEmail,
          allergies,
          ingredients: preferences,
        });

        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert('프로필이 저장되었습니다.');
        location.href = 'mypage.html';
      } catch (err) {
        console.error(err);
        alert('프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  }

  // 초기화 버튼
  if (dangerBtn) {
    dangerBtn.addEventListener('click', async () => {
      if (!confirm("정말 초기화하시겠습니까?\n알레르기 정보와 선호 카테고리가 모두 삭제됩니다.")) return;

      const currentUser = getCurrentUser();
      if (!currentUser) return;

      try {
        const response = await window.apiClient.updateUserApi(currentUser.id, {
          allergies: [],
          ingredients: [],
        });
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert('데이터가 초기화되었습니다.');
        location.reload();
      } catch (err) {
        console.error(err);
        alert('데이터를 초기화하지 못했습니다.');
      }
    });
  }

  // 초기 로드
  loadUserData();
});