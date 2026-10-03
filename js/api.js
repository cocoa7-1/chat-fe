/** Authentication storage and the existing FastAPI contract. */
const TOKEN_KEY = 'chat_access_token';
const USER_KEY = 'chat_user_info';
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function removeToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
async function apiRequest(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(getApiUrl(endpoint), { ...options, headers });
    if (response.status === 401) {
        removeToken();
        if (!/\/(login|register)\.html$/.test(window.location.pathname)) window.location.href = 'login.html';
        throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    }
    return response;
}
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div'); container.id = 'toast-container';
        container.className = 'toast-container'; container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite'); document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + (['error','success'].includes(type) ? type : '');
    const icon = type === 'error' ? 'circle-exclamation' : type === 'success' ? 'circle-check' : 'circle-info';
    toast.innerHTML = '<i class="fa-solid fa-'+icon+'" aria-hidden="true"></i><span>'+escapeHtml(message)+'</span>';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
function setupNavbar(requireAuth = true) {
    const token = getToken(), user = getUser();
    if (requireAuth && !token) { window.location.href = 'login.html'; return false; }
    const nav = document.getElementById('authNav');
    if (nav) {
        if (token && user) {
            const name = user.nickname || user.username || '사용자';
            nav.innerHTML = '<div class="user-info"><span class="user-avatar" aria-hidden="true">'+escapeHtml(Array.from(name)[0])+'</span><span>'+escapeHtml(name)+'</span></div><button class="logout-btn" onclick="handleLogout()" aria-label="로그아웃"><span>로그아웃</span><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" style="margin-left:7px"></i></button>';
        } else {
            nav.innerHTML = '<a href="login.html">로그인</a><a href="register.html" class="button button-small">회원가입</a>';
        }
    }
    return true;
}
async function handleLogout() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    catch { /* Always clear the local session, including an expired token. */ }
    finally { removeToken(); window.location.href = 'login.html'; }
}
function escapeHtml(text) {
    return String(text ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
