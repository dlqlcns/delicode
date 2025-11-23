// ==============================
// DOM 요소
// ==============================
const joinForm = document.getElementById('joinForm');
const nameInput = document.getElementById('name');
const userIdInput = document.getElementById('userId');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('passwordConfirm');
const idCheckBtn = document.getElementById('idCheck');
const emailCheckBtn = document.getElementById('emailCheck');

// ⚠️ HTML에 존재하지 않을 수 있는 요소들 (에러 방지를 위해 확인 필요)
const customAllergyInput = document.getElementById('customAllergy');
const addAllergyBtn = document.getElementById('addAllergy');
const allergyContainer = document.getElementById('allergyContainer');

// ==============================
// 상태 값
// ==============================
let isIdChecked = false;
let isEmailChecked = false;

// 비밀번호 힌트 (안전하게 요소 확인 후 접근)
const passwordHintElement = passwordInput ? passwordInput.nextElementSibling : null;
const originalPasswordHint = passwordHintElement ? passwordHintElement.textContent.trim() : '';


// ==============================
// 메시지 요소 생성
// ==============================
function getOrCreateMessageElement(inputEl, uniqueClassName) {
    let formGroup = inputEl.closest('.form-group');
    let messageEl = formGroup.querySelector(`.${uniqueClassName}`);

    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = uniqueClassName;
        messageEl.classList.add('check-message');

        let hintTexts = formGroup.querySelectorAll('.hint-text');
        let insertionPoint = hintTexts.length > 0 ? hintTexts[hintTexts.length - 1].nextSibling : inputEl.nextSibling;

        formGroup.insertBefore(messageEl, insertionPoint);
    }
    return messageEl;
}


// ==============================
// 아이디 형식 검사
// ==============================
function validateUserId() {
    const userId = userIdInput.value.trim();
    const idMessage = getOrCreateMessageElement(userIdInput, 'id-message');

    const hasEnglish = /[a-zA-Z]/.test(userId);
    const hasNumber = /[0-9]/.test(userId);
    const isLongEnough = userId.length >= 8;
    const hasOnlyEnglishAndNumbers = /^[a-zA-Z0-9]*$/.test(userId);

    const isValid = hasEnglish && hasNumber && isLongEnough && hasOnlyEnglishAndNumbers;

    if (!userId) {
        idMessage.textContent = '';
        userIdInput.classList.remove('error');
        return false;
    }

    if (!isValid) {
        idMessage.textContent = '아이디는 영문, 숫자를 포함하여 8자 이상이어야 합니다';
        idMessage.style.color = '#ef4444';
        userIdInput.classList.add('error');
        isIdChecked = false;
        return false;
    }

    // 🟢 형식 정상 → 경고 제거
    idMessage.textContent = '형식이 올바릅니다.';
    idMessage.style.color = '#16a34a';
    userIdInput.classList.remove('error');

    return true;
}

if (userIdInput) {
    userIdInput.addEventListener("input", validateUserId);
}


// ==============================
// 아이디 중복 확인
// ==============================
if (idCheckBtn) {
    idCheckBtn.addEventListener('click', () => {
        const userId = userIdInput.value.trim();
        const idMessage = getOrCreateMessageElement(userIdInput, 'id-message');

        if (!userId) return alert('아이디를 입력해주세요.');
        if (!validateUserId()) return;

        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        const isDuplicate = userList.some(user => user.userId === userId);

        if (isDuplicate || userId === 'admin') {
            idMessage.textContent = '이미 사용중인 아이디입니다';
            idMessage.style.color = '#ef4444';
            isIdChecked = false;
        } else {
            idMessage.textContent = '사용 가능한 아이디입니다';
            idMessage.style.color = '#16a34a';
            isIdChecked = true;
        }
    });
}


// ==============================
// 이메일 형식 검사
// ==============================
function checkEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


// ==============================
// 이메일 중복 확인
// ==============================
if (emailCheckBtn) {
    emailCheckBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const emailMessage = getOrCreateMessageElement(emailInput, 'email-message');

        if (!email) return alert('이메일을 입력해주세요.');
        if (!checkEmailFormat(email)) return alert('올바른 이메일 형식이 아닙니다.');

        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        const isDuplicate = userList.some(user => user.email === email);

        if (isDuplicate || email === 'test@test.com') {
            emailMessage.textContent = '이미 사용중인 이메일입니다';
            emailMessage.style.color = '#ef4444';
            isEmailChecked = false;
        } else {
            emailMessage.textContent = '사용 가능한 이메일입니다';
            emailMessage.style.color = '#16a34a';
            isEmailChecked = true;
        }
    });
}


// ==============================
// 비밀번호 유효성 검사
// ==============================
function validatePassword() {
    const password = passwordInput.value;

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!%^&*_]/.test(password);
    const isLongEnough = password.length >= 8;

    const conditionsMet = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    const isValid = isLongEnough && conditionsMet >= 2;

    if (password && !isValid) {
        if (passwordHintElement) {
            passwordHintElement.textContent =
                '영문(대소문자), 숫자, 특수문자 중 2가지 이상 포함하여 8자 이상';
            passwordHintElement.style.color = '#ef4444';
        }
        passwordInput.classList.add('error');
    } else {
        if (passwordHintElement) {
            passwordHintElement.textContent = originalPasswordHint;
            passwordHintElement.style.color = '#9ca3af';
        }
        passwordInput.classList.remove('error');
    }

    return isValid;
}

if (passwordInput) {
    passwordInput.addEventListener('input', validatePassword);

    // 엔터 → 제출 막고, 조건 맞으면 다음칸 이동
    passwordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (validatePassword()) {
                passwordConfirmInput.focus();
            }
        }
    });
}


// ==============================
// 비밀번호 확인 검사
// ==============================
function validatePasswordConfirm() {
    const password = passwordInput.value;
    const confirm = passwordConfirmInput.value;

    const msg = getOrCreateMessageElement(passwordConfirmInput, 'password-confirm-message');

    if (!confirm) {
        msg.textContent = '';
        passwordConfirmInput.classList.remove('error');
        return false;
    }

    if (!validatePassword()) {
        msg.textContent = '비밀번호 조건을 먼저 충족해주세요.';
        msg.style.color = '#ef4444';
        return false;
    }

    if (password !== confirm) {
        msg.textContent = '비밀번호가 일치하지 않습니다';
        msg.style.color = '#ef4444';
        passwordConfirmInput.classList.add('error');
        return false;
    }

    msg.textContent = '비밀번호 일치';
    msg.style.color = '#16a34a';
    passwordConfirmInput.classList.remove('error');
    return true;
}

if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener('input', validatePasswordConfirm);

    // 엔터 금지
    passwordConfirmInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
    });
}


// ==============================
// 폼 전체 엔터 제출 금지
// ==============================
if (joinForm) {
    joinForm.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
    });
}


// ==============================
// 알레르기 커스텀 추가 (⚠️ 수정된 부분)
// ==============================
// HTML에 addAllergyBtn이 없으면 이 부분은 실행되지 않도록 보호
if (addAllergyBtn && customAllergyInput && allergyContainer) {
    addAllergyBtn.addEventListener('click', () => {
        const value = customAllergyInput.value.trim();
        if (!value) return alert('재료명을 입력해주세요.');

        const existing = allergyContainer.querySelectorAll('input[type="checkbox"]');
        for (let box of existing) {
            if (box.value.toLowerCase() === value.toLowerCase()) {
                return alert('이미 추가된 재료입니다.');
            }
        }

        const label = document.createElement('label');
        const checkbox = document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.value = value;
        checkbox.checked = true;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + value));
        allergyContainer.appendChild(label);

        customAllergyInput.value = '';
    });
}


// ==============================
// 폼 제출
// ==============================
if (joinForm) {
    joinForm.addEventListener('submit', e => {
        e.preventDefault(); // ⚠️ 이 코드가 실행되어야 새로고침이 막힙니다.

        // 2. 비밀번호 일치 여부 재확인
        if (passwordInput.value !== passwordConfirmInput.value) {
            return alert('비밀번호가 일치하지 않습니다.');
        }

        const allergies = [...document.querySelectorAll('#allergyContainer input[type="checkbox"]:checked')]
            .map(c => c.value);

        const preferences = [...document.querySelectorAll('.join-section:last-of-type input[type="checkbox"]:checked')]
            .map(c => c.value);

        // 비밀번호 공백 제거하여 저장
        const newUser = {
            name: nameInput.value.trim(),
            userId: userIdInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim(), 
            allergies,
            preferences
        };

        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        userList.push(newUser);
        localStorage.setItem('userList', JSON.stringify(userList));

        alert('🎉 회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        window.location.href = 'login.html';
    });
}