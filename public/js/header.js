// header.js - 로그인 상태에 따라 header 버튼 업데이트

const SUPABASE_URL = "https://wskxzuzyxnsywmyqeppt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indza3h6dXp5eG5zeXdteXFlcHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTIwNjQsImV4cCI6MjA3OTM2ODA2NH0.agQ6ULpbq-sivR26yITw2cxhiNF1an5xd0ytRXLfwU0";

let supabaseClient = null;

// Supabase SDK가 없다면 건너뛰고, 있다면 클라이언트를 만들어 둔다.
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function syncSupabaseUserToLocal() {
  if (!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getUser();
  const supaUser = data?.user;
  if (!supaUser) return null;

  const { data: rows } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", supaUser.id);
  if (!rows || rows.length === 0) return null;

  localStorage.setItem("currentUser", JSON.stringify(rows[0]));
  return rows[0];
}

// Supabase와 로컬 스토리지 동기화 시도
syncSupabaseUserToLocal();

document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById("authBtn");
  const headerSearchInput = document.getElementById("headerSearchInput");
  const headerSearchIcon = document.getElementById("headerSearchIcon");

  if (!authBtn) return;

  let currentUser = null;
  try {
    const userData = localStorage.getItem("currentUser");
    if (userData && userData !== "null" && userData !== "undefined") {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    currentUser = null;
  }

  if (currentUser) {
    authBtn.textContent = "로그아웃";
    authBtn.addEventListener("click", async () => {
      const confirmed = confirm("로그아웃 하시겠습니까?");
      if (!confirmed) return;

      localStorage.removeItem("currentUser");
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      alert("로그아웃 되었습니다.");
      window.location.href = "/index.html";
    });
  } else {
    authBtn.textContent = "로그인 / 회원가입";
    authBtn.addEventListener("click", () => {
      window.location.href = "/login.html";
    });
  }

  if (headerSearchInput) {
    headerSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (typeof handleSearch === "function") {
          handleSearch();
        } else if (headerSearchIcon) {
          headerSearchIcon.click();
        }
      }
    });
  }
});
