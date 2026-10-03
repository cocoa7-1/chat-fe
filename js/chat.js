/** Chat sessions, existing SSE API, and sanitized answer presentation. */
let currentSessionId = null, isStreaming = false, sessionRequestId = 0, selectionRequestId = 0;
document.addEventListener('DOMContentLoaded', () => {
    if (!setupNavbar(true)) return;
    loadSessions();
    document.getElementById('chatInput').focus();
});
function autoResizeTextarea(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight,160)+'px';
    document.getElementById('charCounter').textContent = input.value.length+' / 2000';
}
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault(); document.getElementById('chatForm').requestSubmit();
    }
}
function sendQuickPrompt(text) {
    if (isStreaming) return;
    const input = document.getElementById('chatInput');
    input.value = text; autoResizeTextarea(input); document.getElementById('chatForm').requestSubmit();
}
async function loadSessions() {
    const requestId = ++sessionRequestId;
    const list = document.getElementById('sessionsList');
    try {
        const response = await apiRequest('/api/v1/chat/sessions');
        if (!response.ok) throw new Error('대화 목록을 불러오지 못했습니다.');
        const sessions = await response.json();
        if (requestId !== sessionRequestId) return;
        list.innerHTML = '';
        if (!sessions.length) { list.innerHTML = '<p class="rail-empty">첫 질문을 남기면<br>여기에 대화가 모입니다.</p>'; return; }
        for (const session of sessions) {
            const item = document.createElement('div');
            item.className = 'session-item'+(currentSessionId===session.id?' active':'');
            const select = document.createElement('button');
            select.className = 'session-select'; select.disabled = isStreaming;
            select.setAttribute('aria-current',currentSessionId===session.id?'true':'false');
            select.innerHTML = '<i class="fa-regular fa-comment" aria-hidden="true"></i><span>'+escapeHtml(session.title)+'</span>';
            select.onclick = () => selectSession(session.id,session.title);
            const remove = document.createElement('button');
            remove.className = 'session-delete'; remove.disabled = isStreaming;
            remove.setAttribute('aria-label',session.title+' 대화 삭제');
            remove.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
            remove.onclick = () => deleteSession(session.id);
            item.append(select,remove); list.appendChild(item);
        }
    } catch (error) {
        if (requestId===sessionRequestId) list.innerHTML = '<p class="rail-empty">'+escapeHtml(error.message)+'</p>';
    }
}
function renderWelcome() {
    const container = document.getElementById('messagesContainer');
    container.replaceChildren(document.getElementById('welcomeTemplate').content.cloneNode(true));
}
async function selectSession(id,title) {
    if (isStreaming) return;
    const requestId = ++selectionRequestId;
    currentSessionId = id;
    document.getElementById('currentSessionBadge').textContent = '#'+id;
    document.getElementById('currentSessionTitle').textContent = title || '대화';
    document.getElementById('messagesContainer').innerHTML = '<div class="loading-state">대화를 불러오는 중…</div>';
    toggleSidebar(false); loadSessions();
    try {
        const response = await apiRequest('/api/v1/chat/sessions/'+id+'/messages');
        if (!response.ok) throw new Error('대화를 불러오지 못했습니다.');
        const messages = await response.json();
        if (requestId!==selectionRequestId) return;
        document.getElementById('messagesContainer').replaceChildren();
        if (!messages.length) renderWelcome();
        messages.forEach(message => appendMessageBubble(message.role,message.content,message));
        scrollToBottom();
    } catch (error) {
        if (requestId===selectionRequestId) document.getElementById('messagesContainer').innerHTML = '<div class="empty-state">'+escapeHtml(error.message)+'</div>';
    }
}
function createNewSession() {
    if (isStreaming) return;
    ++selectionRequestId; currentSessionId = null;
    document.getElementById('currentSessionBadge').textContent = '새 대화';
    document.getElementById('currentSessionTitle').textContent = '새로운 질문을 시작하세요';
    document.getElementById('errorBanner').classList.add('hidden');
    renderWelcome(); loadSessions(); toggleSidebar(false); document.getElementById('chatInput').focus();
}
async function deleteSession(id) {
    if (isStreaming || !confirm('이 대화와 질문·답변을 삭제할까요? 삭제한 기록은 복구할 수 없습니다.')) return;
    try {
        const response = await apiRequest('/api/v1/chat/sessions/'+id,{method:'DELETE'});
        if (!response.ok) throw new Error('삭제하지 못했습니다.');
        if (currentSessionId===id) createNewSession(); else loadSessions();
        showToast('대화를 삭제했습니다.');
    } catch (error) { showToast(error.message,'error'); }
}
function appendMessageBubble(role,content,meta={}) {
    const element = document.createElement('article');
    element.className = 'message'+(role==='user'?' message-user':'');
    if (role==='user') {
        element.innerHTML = '<div class="user-bubble">'+escapeHtml(content)+'</div>';
    } else {
        element.innerHTML = '<div class="message-avatar" aria-hidden="true"><i class="fa-solid fa-leaf"></i></div><div class="message-content"><div class="message-label">현장노트 · AI 답변</div><div class="markdown-body">'+renderMarkdown(content)+'</div><div class="message-meta"><span>'+(meta.latency_ms?formatDuration(meta.latency_ms):'')+'</span><button class="copy-btn" onclick="copyMessageText(this)" aria-label="답변 텍스트 복사"><i class="fa-regular fa-copy" aria-hidden="true"></i> 복사</button></div></div>';
        element.dataset.content = content;
    }
    document.getElementById('messagesContainer').appendChild(element);
    return element;
}
function appendAssistantStreamingBubble(id) {
    const element = appendMessageBubble('assistant','');
    element.id = id;
    const content = element.querySelector('.markdown-body');
    content.classList.add('content-area','typing-cursor');
    content.innerHTML = '<span class="thinking-label">질문을 살펴보고 있어요…</span>';
    element.querySelector('.message-meta').classList.add('hidden');
    return element;
}
function updateStreamingBubbleText(id,text) {
    const element = document.getElementById(id);
    if (!element) return;
    element.dataset.content = text;
    element.querySelector('.content-area').innerHTML = renderMarkdown(text);
}
function finishStreamingBubble(id,text,latency,status) {
    const element = document.getElementById(id);
    if (!element) return;
    updateStreamingBubbleText(id,text);
    element.querySelector('.content-area').classList.remove('typing-cursor');
    element.querySelector('.message-meta').classList.remove('hidden');
    element.querySelector('.message-meta span').textContent = (latency?formatDuration(latency)+' · ':'')+(status==='success'?'답변 완료':'답변 확인 필요');
}
function setStreamingState(streaming) {
    isStreaming = streaming;
    const button = document.getElementById('sendBtn');
    button.disabled = streaming;
    button.setAttribute('aria-label',streaming?'답변을 받는 중':'질문 보내기');
    button.innerHTML = '<i class="fa-solid '+(streaming?'fa-spinner fa-spin':'fa-arrow-up')+'" aria-hidden="true"></i>';
    document.getElementById('chatInput').readOnly = streaming;
    document.getElementById('chatForm').setAttribute('aria-busy',String(streaming));
    document.querySelectorAll('.new-chat,.session-select,.session-delete,.topic-card').forEach(item => item.disabled = streaming);
}
async function handleChatSubmit(event) {
    event.preventDefault();
    if (isStreaming) return;
    const input = document.getElementById('chatInput'), message = input.value.trim();
    if (!message) return;
    ++selectionRequestId;
    input.value = ''; autoResizeTextarea(input);
    document.getElementById('welcomeHero')?.remove();
    document.getElementById('errorBanner').classList.add('hidden');
    appendMessageBubble('user',message);
    const bubbleId = 'ai-stream-'+Date.now();
    appendAssistantStreamingBubble(bubbleId); setStreamingState(true); scrollToBottom();
    let fullText = '', finished = false;
    try {
        const headers = {'Content-Type':'application/json'}, token = getToken();
        if (token) headers.Authorization = 'Bearer '+token;
        const response = await fetch(getApiUrl('/api/v1/chat/stream'),{
            method:'POST',headers,body:JSON.stringify({message,session_id:currentSessionId})
        });
        if (response.status===401) { removeToken(); window.location.href='login.html'; throw new Error('다시 로그인해 주세요.'); }
        if (!response.ok) throw new Error('요청을 처리하지 못했습니다. (HTTP '+response.status+')');
        const reader = response.body.getReader(), decoder = new TextDecoder();
        let buffer = '';
        function processEvent(block) {
            let type = 'message';
            const data = [];
            for (const line of block.split('\n')) {
                if (line.startsWith('event:')) type = line.slice(6).trim();
                if (line.startsWith('data:')) data.push(line.slice(5).trim());
            }
            if (!data.length) return;
            const value = JSON.parse(data.join('\n'));
            if (type==='meta' && !currentSessionId) {
                currentSessionId = value.session_id;
                document.getElementById('currentSessionBadge').textContent = '#'+value.session_id;
                document.getElementById('currentSessionTitle').textContent = value.session_title;
                loadSessions();
            } else if (type==='done') {
                finished = true; finishStreamingBubble(bubbleId,fullText,value.latency_ms,value.status);
            } else if (type==='error') { showErrorBanner(value.message || '답변 중 오류가 발생했습니다.'); }
            else if (value.text) { fullText += value.text; updateStreamingBubbleText(bubbleId,fullText); scrollToBottom(); }
        }
        while (true) {
            const {done,value} = await reader.read();
            buffer = (buffer + decoder.decode(value || new Uint8Array(),{stream:!done})).replace(/\r\n/g,'\n');
            let boundary;
            while ((boundary=buffer.indexOf('\n\n'))>=0) {
                const block = buffer.slice(0,boundary); buffer = buffer.slice(boundary+2);
                if (block.trim()) processEvent(block);
            }
            if (done) break;
        }
        if (buffer.trim()) processEvent(buffer);
        if (!finished) throw new Error('답변 연결이 종료되었습니다. 잠시 후 다시 질문해 주세요.');
    } catch (error) {
        showErrorBanner(error.message || '서버 연결을 확인해 주세요.');
        finishStreamingBubble(bubbleId,fullText || '답변을 받지 못했습니다. 잠시 후 다시 질문해 주세요.',null,'error');
    } finally { setStreamingState(false); input.focus(); loadSessions(); }
}
function showErrorBanner(message) {
    document.getElementById('errorBannerText').textContent = message;
    document.getElementById('errorBanner').classList.remove('hidden');
}
function scrollToBottom() { const container=document.getElementById('messagesContainer'); container.scrollTop=container.scrollHeight; }
async function copyMessageText(button) {
    const content = button.closest('.message')?.dataset.content;
    try { await navigator.clipboard.writeText(content || ''); showToast('답변을 복사했습니다.','success'); }
    catch { showToast('복사하지 못했습니다. 답변을 직접 선택해 복사해 주세요.','error'); }
}
