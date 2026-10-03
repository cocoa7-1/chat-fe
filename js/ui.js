/** Shared presentation helpers. */
function toggleSidebar(open) {
    const expanded = typeof open === 'boolean' ? open : !document.body.classList.contains('sidebar-open');
    document.body.classList.toggle('sidebar-open', expanded);
    syncSidebarAccess();
    document.querySelector('.mobile-menu')?.setAttribute('aria-expanded', String(expanded));
    if (expanded) document.querySelector('.sidebar .rail-link')?.focus();
    else document.querySelector('.mobile-menu')?.focus();
}
function syncSidebarAccess() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.inert = window.matchMedia('(max-width: 760px)').matches && !document.body.classList.contains('sidebar-open');
}
document.addEventListener('DOMContentLoaded', syncSidebarAccess);
window.matchMedia('(max-width: 760px)').addEventListener('change', syncSidebarAccess);
function togglePassword(id, button) {
    const input = document.getElementById(id);
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? '비밀번호 숨기기' : '비밀번호 표시');
    button.innerHTML = '<i class="fa-regular '+(visible?'fa-eye-slash':'fa-eye')+'" aria-hidden="true"></i>';
}
function renderMarkdown(text) {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(marked.parse(String(text || ''), { breaks: true, gfm: true }), {
            USE_PROFILES: { html: true }, FORBID_TAGS: ['img', 'style'], FORBID_ATTR: ['style']
        });
    }
    return '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
}
function formatDuration(milliseconds) {
    if (milliseconds === null || milliseconds === undefined || !Number.isFinite(Number(milliseconds))) return '—';
    return (Number(milliseconds)/1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '초';
}
function formatRecordDate(value) {
    if (!value) return '—';
    // The backend stores UTC timestamps without a timezone suffix.
    const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + 'Z';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
}
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) toggleSidebar(false);
    if (event.key === 'Tab' && document.body.classList.contains('sidebar-open')) {
        const items = Array.from(document.querySelectorAll('.sidebar a,.sidebar button:not(:disabled)'));
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
});
