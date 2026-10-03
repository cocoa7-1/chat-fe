/**
 * Frontend Global Configuration
 */
// 배포 백엔드의 HTTPS 주소입니다. /api/v1 경로는 붙이지 않습니다.
const DEPLOYED_API_BASE_URL = 'https://b71chatbe.ddns.net';
const isLocal = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname);

const CONFIG = {
    API_BASE_URL: isLocal ? 'http://localhost:8000' : DEPLOYED_API_BASE_URL.replace(/\/+$/, ''),
    APP_NAME: '현장노트 · 건설 지식 AI 어시스턴트',
    VERSION: '1.1.0'
};

function getApiUrl(endpoint) {
    if (!CONFIG.API_BASE_URL || (!isLocal && !CONFIG.API_BASE_URL.startsWith('https://'))) {
        throw new Error('서비스 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    }
    return `${CONFIG.API_BASE_URL}${endpoint}`;
}
