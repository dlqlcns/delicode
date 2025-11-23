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
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert('로그인에 성공했습니다.');
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        alert(err.message || '로그인에 실패했습니다.');
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
