const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');

async function handleLogin(event) {
    event.preventDefault();
    const identifier = identifierInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!identifier || !password) {
        alert('아이디(또는 이메일)와 비밀번호를 모두 입력해주세요.');
        return;
    }

    try {
        const response = await window.apiClient.loginUserApi({ identifier, password });
        let user = response.user;

        try {
            const fresh = await window.apiClient.fetchUserApi(response.user.id);
            if (fresh?.user) user = fresh.user;
        } catch (err) {
            console.warn('사용자 세부 정보를 다시 불러오지 못했습니다. 로그인 응답 데이터를 사용합니다.', err);
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('로그인에 성공했습니다.');
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        const message = err.message === '등록되지 않은 아이디이거나 아이디 또는 비밀번호를 잘못 입력했습니다.'
            ? err.message
            : (err.message || '로그인에 실패했습니다.');
        alert(message);
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// ===============================
// 🔥 Google 로그인 후 자동 처리
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return;

  // users 테이블에 정보 있는지 확인
  const { data: rows } = await supabase.from("users").select("*").eq("id", user.id);

  // users 테이블에 없다 → 추가 정보 입력 페이지 이동
  if (!rows || rows.length === 0) {
    return (window.location.href = "/join.html");
  }

  // 있다 → 로그인 유지 및 메인 이동
  localStorage.setItem("currentUser", JSON.stringify(rows[0]));
  window.location.href = "/index.html";
});
