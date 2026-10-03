/** Registration and login preserve the backend's existing payloads. */
document.addEventListener('DOMContentLoaded', () => setupNavbar(false));
function setAuthBusy(busy, registering = false) {
    const button = document.getElementById('submitBtn');
    button.disabled = busy;
    button.innerHTML = busy
        ? '<span>'+(registering?'계정을 만드는 중…':'로그인하는 중…')+'</span><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>'
        : '<span>'+(registering?'계정 만들기':'로그인')+'</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
}
function showAuthError(message) {
    document.getElementById('errorText').textContent = typeof message === 'string' ? message : '입력 내용을 확인해 주세요.';
    document.getElementById('errorMessage').classList.remove('hidden');
}
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    document.getElementById('errorMessage').classList.add('hidden');
    setAuthBusy(true);
    try {
        const response = await fetch(getApiUrl('/api/v1/auth/login'), {
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})
        });
        const data = await response.json();
        if (!response.ok) { showAuthError(data.detail || '아이디와 비밀번호를 확인해 주세요.'); setAuthBusy(false); return; }
        setToken(data.access_token, data.user);
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = ['index.html','logs.html'].includes(redirect) ? redirect : 'index.html';
    } catch {
        showAuthError(CONFIG.API_BASE_URL ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' : '서비스 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        setAuthBusy(false);
    }
}
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('passwordConfirm').value;
    if (username.length < 3 || username.length > 30) return showAuthError('아이디는 3~30자로 입력해 주세요.');
    if (!nickname || nickname.length > 30) return showAuthError('닉네임은 공백을 제외하고 1~30자로 입력해 주세요.');
    if (password.trim().length < 8 || password.length > 100) return showAuthError('비밀번호는 8~100자로 입력해 주세요.');
    if (password !== confirm) return showAuthError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    document.getElementById('errorMessage').classList.add('hidden');
    setAuthBusy(true,true);
    try {
        const response = await fetch(getApiUrl('/api/v1/auth/register'), {
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,nickname,password})
        });
        const data = await response.json();
        if (!response.ok) { showAuthError(data.detail || '계정을 만들지 못했습니다. 입력 내용을 확인해 주세요.'); setAuthBusy(false,true); return; }
        showToast('회원가입이 완료되었습니다. 로그인해 주세요.','success');
        setTimeout(() => { window.location.href = 'login.html'; },600);
    } catch {
        showAuthError(CONFIG.API_BASE_URL ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' : '서비스 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        setAuthBusy(false,true);
    }
}
