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
        alert(err.message || '로그인에 실패했습니다.');
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
