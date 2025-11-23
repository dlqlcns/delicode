const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

async function handleLogin(event) {
    event.preventDefault();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }

    try {
        const response = await window.apiClient.loginUserApi({ email, password });
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
