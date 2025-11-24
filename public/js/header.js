// header.js - 로그인 상태에 따라 header 버튼 업데이트

// =======================
// 🔥 Supabase 로그인 체크 추가
// =======================
async function syncSupabaseUserToLocal() {
  const { data } = await supabase.auth.getUser();
  const supaUser = data?.user;
  if (!supaUser) return null;

  // users 테이블에서 상세 정보 조회
  const { data: rows } = await supabase.from("users").select("*").eq("id", supaUser.id);
  if (!rows || rows.length === 0) return null;

  localStorage.setItem("currentUser", JSON.stringify(rows[0]));
  return rows[0];
}
syncSupabaseUserToLocal();

document.addEventListener("DOMContentLoaded", () => {
    const authBtn = document.getElementById("authBtn");
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerSearchIcon = document.getElementById('headerSearchIcon');

    if (!authBtn) return;

    // ✅ JSON 파싱 시도 + null/빈 문자열 체크
    let currentUser = null;
    try {
        const userData = localStorage.getItem("currentUser");
        // null, "null", "", undefined 모두 걸러냄
        if (userData && userData !== "null" && userData !== "undefined") {
            currentUser = JSON.parse(userData);
        }
    } catch (e) {
        // JSON 파싱 실패 시 null로 처리
        currentUser = null;
    }

    // 로그인 상태: 로그아웃 버튼으로 변경
    if (currentUser) {
        authBtn.textContent = "로그아웃";
        authBtn.addEventListener("click", () => {
            const confirmed = confirm("로그아웃 하시겠습니까?");
            if (confirmed) {
                // 유저 정보는 localStorage에 그대로 유지
                // currentUser만 삭제하여 로그아웃 처리
                localStorage.removeItem("currentUser");
                alert("로그아웃 되었습니다.");
                window.location.href = "index.html";
            }
        });
    } 
    // 로그아웃 상태: 로그인/회원가입 버튼 유지

    else {
        authBtn.textContent = "로그인 / 회원가입";
        authBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    if (headerSearchInput) {
        headerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof handleSearch === 'function') {
                    handleSearch();
                } else if (headerSearchIcon) {
                    headerSearchIcon.click();
                }
            }
        });
    }
});
