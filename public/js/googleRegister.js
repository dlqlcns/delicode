const SUPABASE_URL = "https://wskxzuzyxnsywmyqeppt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indza3h6dXp5eG5zeXdteXFlcHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTIwNjQsImV4cCI6MjA3OTM2ODA2NH0.agQ6ULpbq-sivR26yITw2cxhiNF1an5xd0ytRXLfwU0";

const registerForm = document.getElementById("googleRegisterForm");
const nameInput = document.getElementById("name");
const allergyContainer = document.getElementById("allergyContainer");
const categoryContainer = document.getElementById("categoryContainer");

let supabaseClient = null;
let authUser = null;

async function ensureAuthSession() {
  const client = await ensureSupabaseClient();

  const searchParams = new URLSearchParams(window.location.search || '');
  const hash = window.location.hash?.replace(/^#/, '') || '';
  const hashParams = new URLSearchParams(hash);
  const code = searchParams.get('code') || hashParams.get('code');

  if (!code) return;

  const { error } = await client.auth.exchangeCodeForSession(code);
  if (!error) {
    const cleanedParams = new URLSearchParams(window.location.search || '');
    cleanedParams.delete('code');
    cleanedParams.delete('state');
    const suffix = cleanedParams.toString();
    history.replaceState(null, '', `${window.location.pathname}${suffix ? `?${suffix}` : ''}`);
  } else {
    console.warn('Supabase OAuth code exchange failed', error);
  }
}

function getCheckedValues(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(
    (el) => el.value
  );
}

async function ensureSupabaseClient() {
  if (!supabaseClient) {
    if (!window.supabase) {
      alert("필수 라이브러리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      throw new Error("Supabase client unavailable");
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

async function loadAuthUser() {
  const client = await ensureSupabaseClient();
  await ensureAuthSession();
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    alert("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
    window.location.href = "/login.html";
    throw new Error(error?.message || "Missing authenticated user");
  }
  authUser = data.user;
  return authUser;
}

async function saveUserProfile(event) {
  event.preventDefault();

  if (!authUser) {
    await loadAuthUser();
  }

  const displayName = nameInput?.value.trim();
  if (!displayName) {
    alert("사용자 이름을 입력해주세요.");
    return;
  }

  const allergies = getCheckedValues(allergyContainer);
  const ingredients = getCheckedValues(categoryContainer);
  try {
    const response = await window.apiClient.upsertSocialUserApi({
      id: authUser.id,
      username: displayName,
      email: authUser.email,
      allergies,
      ingredients,
    });

    const savedUser = response?.user;
    if (savedUser) {
      localStorage.setItem("currentUser", JSON.stringify(savedUser));
    }

    alert("추가 정보가 저장되었습니다. 메인 페이지로 이동합니다.");
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
    alert(err.message || "추가 정보 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}

(async function init() {
  if (!registerForm) return;

  await loadAuthUser();

  alert("구글 로그인에 성공했어요!\n서비스 이용을 위해 간단한 추가 정보를 입력해 주세요.");

  if (nameInput && authUser?.user_metadata?.full_name) {
    nameInput.value = authUser.user_metadata.full_name;
  }

  registerForm.addEventListener("submit", saveUserProfile);
})();
