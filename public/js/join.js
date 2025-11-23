const joinForm = document.getElementById('joinForm');
const nameInput = document.getElementById('name');
const userIdInput = document.getElementById('userId');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('passwordConfirm');
const idCheckBtn = document.getElementById('idCheck');
const emailCheckBtn = document.getElementById('emailCheck');
const allergyContainer = document.getElementById('allergyContainer');

function getCheckedValues(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
}

function validatePasswordMatch() {
    if (!passwordInput || !passwordConfirmInput) return true;
    return passwordInput.value === passwordConfirmInput.value;
}

async function checkAvailability({ username, email }) {
    try {
        const response = await window.apiClient.checkAvailabilityApi({ username, email });
        return response.available;
    } catch (err) {
        console.error(err);
        alert('중복 확인 중 오류가 발생했습니다.');
        return false;
    }
}

if (idCheckBtn) {
    idCheckBtn.addEventListener('click', async () => {
        const username = userIdInput?.value.trim();
        if (!username) return alert('아이디를 입력해주세요.');
        const available = await checkAvailability({ username });
        alert(available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
    });
}

if (emailCheckBtn) {
    emailCheckBtn.addEventListener('click', async () => {
        const email = emailInput?.value.trim();
        if (!email) return alert('이메일을 입력해주세요.');
        const available = await checkAvailability({ email });
        alert(available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.');
    });
}

async function handleJoin(event) {
    event.preventDefault();

    const username = userIdInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    const passwordConfirm = passwordConfirmInput?.value.trim();

    if (!username || !email || !password) {
        alert('필수 정보를 모두 입력해주세요.');
        return;
    }

    if (!validatePasswordMatch()) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    const allergies = getCheckedValues(allergyContainer);
    const ingredients = getCheckedValues(document.querySelector('.join-section .checkbox-grid:last-of-type'));
    const displayName = nameInput?.value.trim();

    try {
        const response = await window.apiClient.registerUserApi({
            username,
            email,
            password,
            allergies,
            ingredients,
            name: displayName,
        });
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = 'login.html';
    } catch (err) {
        console.error(err);
        alert(err.message || '회원가입 중 오류가 발생했습니다.');
    }
}

if (joinForm) {
    joinForm.addEventListener('submit', handleJoin);
}
