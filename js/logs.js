/** Personal history, server pagination, and page-local search. */
let logItems = [], logTotal = 0, logOffset = 0, logRole = '', logsRequestId = 0;
const LOG_PAGE_SIZE = 50;
document.addEventListener('DOMContentLoaded', () => {
    if (!setupNavbar(true)) return;
    refreshLogs();
    document.getElementById('logDetail').addEventListener('click', event => {
        if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }
    });
});
async function refreshLogs() { await Promise.allSettled([fetchLogs(), fetchLogStats()]); }
async function fetchLogStats() {
    const ids = ['statTotalLogs','statSessions','statAvgLatency','statSuccessRate'];
    try {
        const response = await apiRequest('/api/v1/logs/stats');
        if (!response.ok) throw new Error('통계 조회 실패');
        const stats = await response.json();
        document.getElementById('statTotalLogs').textContent = Number(stats.total_questions || 0).toLocaleString('ko-KR');
        document.getElementById('statSessions').textContent = Number(stats.total_sessions || 0).toLocaleString('ko-KR');
        document.getElementById('statAvgLatency').textContent = stats.total_answers ? formatDuration(stats.avg_latency_ms) : '—';
        document.getElementById('statSuccessRate').textContent = stats.total_questions ? Number(stats.success_rate_percent).toLocaleString('ko-KR') + '%' : '—';
    } catch {
        ids.forEach(id => document.getElementById(id).textContent = '—');
        showToast('대화 통계를 불러오지 못했습니다. 새로고침해 주세요.', 'error');
    }
}
async function fetchLogs() {
    const requestId = ++logsRequestId;
    const body = document.getElementById('logsTableBody');
    const refresh = document.getElementById('refreshLogs');
    refresh.disabled = true;
    document.getElementById('prevPage').disabled = true;
    document.getElementById('nextPage').disabled = true;
    body.innerHTML = '<tr><td colspan="6" class="loading-state"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 기록을 불러오는 중…</td></tr>';
    const status = document.getElementById('statusFilter').value;
    let endpoint = '/api/v1/logs?limit='+LOG_PAGE_SIZE+'&offset='+logOffset;
    if (status) endpoint += '&status='+encodeURIComponent(status);
    try {
        const response = await apiRequest(endpoint);
        if (!response.ok) throw new Error('기록을 불러올 수 없습니다.');
        const data = await response.json();
        if (requestId !== logsRequestId) return;
        logItems = data.items || []; logTotal = Number(data.total || 0);
        if (!logItems.length && logOffset > 0 && logTotal <= logOffset) {
            logOffset = Math.max(0, Math.ceil(logTotal/LOG_PAGE_SIZE)-1)*LOG_PAGE_SIZE;
            return await fetchLogs();
        }
        renderLogs();
        document.getElementById('lastUpdated').textContent = '최근 확인 '+new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Seoul'}).format(new Date());
    } catch (error) {
        if (requestId !== logsRequestId) return;
        logItems = [];
        body.innerHTML = '<tr><td colspan="6" class="empty-state">'+escapeHtml(error.message)+'<br>잠시 후 새로고침해 주세요.</td></tr>';
        document.getElementById('logCountLabel').textContent = '기록 조회 실패';
        document.getElementById('pageLabel').textContent = '—';
    } finally { if (requestId === logsRequestId) refresh.disabled = false; }
}
function renderLogs() {
    const query = document.getElementById('logSearch').value.trim().toLocaleLowerCase();
    const items = logItems.filter(item => (!logRole || item.role === logRole) &&
        (!query || String(item.content || '').toLocaleLowerCase().includes(query)));
    const body = document.getElementById('logsTableBody');
    if (!items.length) {
        const filtered = query || logRole || document.getElementById('statusFilter').value;
        body.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fa-regular fa-folder-open" aria-hidden="true"></i>'+ (filtered?'조건에 맞는 기록이 없어요. 검색어나 필터를 바꿔보세요.':'아직 기록이 없어요. 지식 채팅에서 첫 질문을 남겨보세요.')+'</td></tr>';
    } else {
        body.innerHTML = items.map(item => {
            const assistant = item.role === 'assistant', success = item.status === 'success';
            const status = success ? '성공' : item.status === 'timeout' ? '시간 초과' : '오류';
            const date = formatRecordDate(item.created_at);
            const preview = String(item.content || '').split('\n').filter(line => line.trim() && !/^\s*\|/.test(line)).join(' ').replace(/[#*_>]/g,'').replaceAll(String.fromCharCode(96),'');
            return '<tr><td><span class="role-label '+(assistant?'assistant':'')+'"><i class="fa-'+(assistant?'solid fa-leaf':'regular fa-comment')+'" aria-hidden="true"></i>'+(assistant?'AI 답변':'나의 질문')+'</span></td><td class="content-cell"><button class="record-preview" onclick="openLogDetail('+Number(item.id)+')" aria-label="'+(assistant?'답변':'질문')+' 기록 '+Number(item.id)+' 전체 내용 보기">'+escapeHtml(preview)+'</button><div class="record-preview-hint">#'+Number(item.id)+' · '+escapeHtml(item.username)+'</div></td><td class="record-date">'+escapeHtml(date)+'</td><td class="muted-cell desktop-column">#'+Number(item.session_id)+'</td><td class="muted-cell desktop-column">'+(assistant?formatDuration(item.latency_ms):'—')+'</td><td><span class="status-pill '+(success?'':'error')+'">'+status+'</span></td></tr>';
        }).join('');
    }
    const pages = Math.max(1, Math.ceil(logTotal/LOG_PAGE_SIZE)), page = Math.floor(logOffset/LOG_PAGE_SIZE)+1;
    document.getElementById('pageLabel').textContent = page+' / '+pages;
    document.getElementById('prevPage').disabled = logOffset === 0;
    document.getElementById('nextPage').disabled = logOffset + LOG_PAGE_SIZE >= logTotal;
    document.getElementById('logCountLabel').textContent = (logTotal ? (logOffset+1)+'–'+Math.min(logOffset+LOG_PAGE_SIZE,logTotal)+' / 전체 '+logTotal+'개 메시지' : '0개 메시지') + ((query||logRole)?' · 현재 페이지 '+items.length+'개 표시':'');
}
function setLogRole(role, button) {
    logRole = role;
    document.querySelectorAll('.record-tab').forEach(tab => {
        tab.classList.toggle('active',tab===button); tab.setAttribute('aria-pressed',String(tab===button));
    });
    renderLogs();
}
function changeLogStatus() { logOffset = 0; fetchLogs(); }
function changeLogPage(direction) { logOffset = Math.max(0,logOffset+direction*LOG_PAGE_SIZE); fetchLogs(); }
function openLogDetail(id) {
    const item = logItems.find(item => item.id === id);
    if (!item) return;
    document.getElementById('detailTitle').textContent = item.role === 'assistant' ? 'AI 답변' : '나의 질문';
    document.getElementById('detailMeta').textContent = '#'+item.id+' · 대화 #'+item.session_id+' · '+formatRecordDate(item.created_at)+(item.role==='assistant'?' · '+formatDuration(item.latency_ms):'');
    document.getElementById('detailContent').innerHTML = item.role === 'assistant' ? renderMarkdown(item.content) : '<p style="white-space:pre-wrap">'+escapeHtml(item.content)+'</p>';
    document.getElementById('logDetail').showModal();
}
