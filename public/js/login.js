// ============================================
// DOM 로드 후 실행
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // 💡 수정: login.html의 ID에 맞춰 userId와 password를 명확하게 가져옵니다.
    const userIdInput = document.getElementById('userId'); 
    const passwordInput = document.getElementById('password');

    // 회원가입 페이지 이동 버튼
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            window.location.href = 'join.html';
        });
    }

    if (!loginForm) return;

    // ================================
    // 로그인 처리
    // ================================
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // DOM 요소가 정상적으로 로드되지 않았을 경우를 대비한 추가 방어 코드 (login.html 구조상 필요)
        if (!userIdInput || !passwordInput) {
            console.error('로그인 입력 필드를 찾을 수 없습니다.');
            alert('로그인 폼 요소 로드 오류. 페이지를 새로고침해주세요.');
            return;
        }

        const loginId = userIdInput.value.trim();
        const password = passwordInput.value.trim();

        // 입력 체크
        if (!loginId) {
            alert('아이디 또는 이메일 주소를 입력해주세요.');
            userIdInput.focus();
            return;
        }

        if (!password) {
            alert('비밀번호를 입력해주세요.');
            passwordInput.focus();
            return;
        }

        // ============================================
        // LocalStorage 기반 로그인 방식 ①
        // 여러 회원을 저장하는 userList 사용
        // ============================================
        let userList = JSON.parse(localStorage.getItem('userList')) || [];
        let foundUser = userList.find(
            u => (u.userId === loginId || u.email === loginId) && u.password === password
        );

        // ============================================
        // LocalStorage 기반 로그인 방식 ② (registeredUser 단독 저장 방식)
        // 기존 코드 호환을 위해 유지
        // ============================================
        const storedUser = localStorage.getItem('registeredUser');
        if (!foundUser && storedUser) {
            const u = JSON.parse(storedUser);
            const isIdMatch = u.userId === loginId;
            const isEmailMatch = u.email === loginId;
            const isPasswordMatch = u.password === password;

            if ((isIdMatch || isEmailMatch) && isPasswordMatch) {
                foundUser = u;
            }
        }

        // ============================================
        // 로그인 실패 처리
        // ============================================
        if (!foundUser) {
            alert('❌ 아이디 또는 비밀번호가 일치하지 않습니다.');
            return;
        }

        // ============================================
        // 로그인 성공 → currentUser 저장
        // 💡 수정: foundUser의 모든 정보 (특히 allergies, preferences)를 저장합니다.
        // ============================================
        const currentUserData = {
            name: foundUser.name,
            userId: foundUser.userId,
            email: foundUser.email,
            allergies: foundUser.allergies || [],
            preferences: foundUser.preferences || []
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUserData));

        alert(`환영합니다, ${foundUser.name}님! 🎉`);
        window.location.href = 'index.html';
    });
});


// ============================================
// 로그아웃 함수 (모든 페이지에서 사용 가능)
// ============================================
function logout() {
    const confirmed = confirm('로그아웃 하시겠습니까?');
    if (confirmed) {
        localStorage.removeItem('currentUser');
        alert('로그아웃 되었습니다.');
        window.location.href = 'login.html';
    }
}


// ============================================
// 보호 페이지용 로그인 확인 함수
// ============================================
function requireLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('로그인이 필요한 페이지입니다.');
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

// 사용 예시 (mypage.html 등)
// document.addEventListener('DOMContentLoaded', () => {
//     if (!requireLogin()) return;
//     // 나머지 코드 실행
// });



    // // --- 기존 백엔드 로그인 로직 (주석 처리) ---
    // const hashedPassword = await hashPassword(password);

    // const loginData = {
    //     login_id: login_id,
    //     password: hashedPassword
    // };

    // fetch('http://localhost:3000/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(loginData)
    // })
    // .then(res => res.json())
    // .then(data => {
    //     const messageEl = getOrCreateMessageElement(passwordInput, 'login-message');
    //     if (data.success) {
    //         alert(`🎉 로그인 성공! 환영합니다, ${data.username}님.`);
    //         // 로그인 성공 시 이동
    //         window.location.href = 'index.html';
    //     } else {
    //         messageEl.textContent = data.message || '로그인 실패: 아이디 또는 비밀번호 확인';
    //         messageEl.style.color = '#ef4444';
    //     }
    // })
    // .catch(err => {
    //     console.error('로그인 요청 실패:', err);
    //     alert('서버 오류 발생');
    // });
// }); // 주석 처리된 백엔드 로직의 닫는 괄호는 제거했습니다.

// 사용 예시 (mypage.html 등)
// document.addEventListener('DOMContentLoaded', () => {
//     if (!requireLogin()) return;
//     // 나머지 코드 실행
// });



    // // --- 기존 백엔드 로그인 로직 (주석 처리) ---
    // const hashedPassword = await hashPassword(password);

    // const loginData = {
    //     login_id: login_id,
    //     password: hashedPassword
    // };

    // fetch('http://localhost:3000/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(loginData)
    // })
    // .then(res => res.json())
    // .then(data => {
    //     const messageEl = getOrCreateMessageElement(passwordInput, 'login-message');
    //     if (data.success) {
    //         alert(`🎉 로그인 성공! 환영합니다, ${data.username}님.`);
    //         // 로그인 성공 시 이동
    //         window.location.href = 'index.html';
    //     } else {
    //         messageEl.textContent = data.message || '로그인 실패: 아이디 또는 비밀번호 확인';
    //         messageEl.style.color = '#ef4444';
    //     }
    // })
    // .catch(err => {
    //     console.error('로그인 요청 실패:', err);
    //     alert('서버 오류 발생');
    // });
;