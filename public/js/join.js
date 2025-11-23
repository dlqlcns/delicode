const joinForm = document.getElementById('joinForm');
const nameInput = document.getElementById('name');
const userIdInput = document.getElementById('userId');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('passwordConfirm');
const idCheckBtn = document.getElementById('idCheck');
const emailCheckBtn = document.getElementById('emailCheck');
const allergyContainer = document.getElementById('allergyContainer');
const idMessage = document.getElementById('idMessage');
const emailMessage = document.getElementById('emailMessage');
const passwordMessage = document.getElementById('passwordMessage');
const passwordConfirmMessage = document.getElementById('passwordConfirmMessage');

const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCheckedValues(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
}

function setFeedback(el, message, isValid = false) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('valid-message', Boolean(isValid));
}

function isValidPasswordFormat(value) {
    if (!value || value.length < 8) return false;
    let categories = 0;
    if (/[A-Za-z]/.test(value)) categories += 1;
    if (/\d/.test(value)) categories += 1;
    if (/[!%^&*_]/.test(value)) categories += 1;
    return categories >= 2;
}

function validateUsername() {
    const value = userIdInput?.value.trim() || '';
    const valid = usernameRegex.test(value);
    setFeedback(idMessage, valid ? '' : '올바르지 않은 형식입니다.');
    return valid;
}

function validateEmail() {
    const value = emailInput?.value.trim() || '';
    const valid = emailRegex.test(value);
    setFeedback(emailMessage, valid ? '' : '올바르지 않은 형식입니다.');
    return valid;
}

function validatePassword() {
    const value = passwordInput?.value.trim() || '';
    const valid = isValidPasswordFormat(value);
    setFeedback(passwordMessage, valid ? '' : '올바르지 않은 형식입니다.');
    return valid;
}

function validatePasswordMatch() {
    if (!passwordInput || !passwordConfirmInput) return true;
    const base = passwordInput.value;
    const confirm = passwordConfirmInput.value;

    if (!confirm) {
        setFeedback(passwordConfirmMessage, '');
        return false;
    }

    if (base === confirm) {
        setFeedback(passwordConfirmMessage, '비밀번호가 일치합니다.', true);
        return true;
    }

    setFeedback(passwordConfirmMessage, '비밀번호가 일치하지 않습니다.');
    return false;
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
        if (!validateUsername()) {
            alert('아이디를 올바르게 입력해주세요.');
            return;
        }
        const available = await checkAvailability({ username });
        alert(available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
    });
}

if (emailCheckBtn) {
    emailCheckBtn.addEventListener('click', async () => {
        const email = emailInput?.value.trim();
        if (!validateEmail()) {
            alert('이메일을 올바르게 입력해주세요.');
            return;
        }
        const available = await checkAvailability({ email });
        alert(available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.');
    });
}

if (userIdInput) userIdInput.addEventListener('input', validateUsername);
if (emailInput) emailInput.addEventListener('input', validateEmail);
if (passwordInput) passwordInput.addEventListener('input', () => {
    validatePassword();
    validatePasswordMatch();
});
if (passwordConfirmInput) passwordConfirmInput.addEventListener('input', validatePasswordMatch);

async function handleJoin(event) {
    event.preventDefault();

    const username = userIdInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    const passwordConfirm = passwordConfirmInput?.value.trim();

    const validations = [
        validateUsername(),
        validateEmail(),
        validatePassword(),
        validatePasswordMatch(),
    ];

    if (validations.includes(false) || !username || !email || !password || !passwordConfirm) {
        alert('입력한 정보를 다시 확인해주세요.');
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
