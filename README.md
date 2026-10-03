# 🌐 건설 안전 & 시공 전문 AI 튜터 - 프론트엔드 (`chat-fe`)

FastAPI 백엔드(`chat-be`)와 연동하여 실시간 SSE 스트리밍 채팅, 사용자 인증, 대화 세션 관리 및 DB 대화 로그 조회를 제공하는 정적 웹 클라이언트입니다. (Vercel 배포 지원)

---

## 🛠️ 기술 스택
- **HTML5 & Vanilla JavaScript (ES6+)**
- **TailwindCSS (CDN)** - 모던 다크 테마 UI & 반응형 레이아웃
- **Marked.js & Highlight.js** - AI 마크다운 및 코드 블록 하이라이팅
- **FontAwesome 6** - UI 아이콘

---

## 📁 디렉토리 구조
```text
chat-fe/
├── index.html        # 메인 채팅 화면 (대화 세션, SSE 스트리밍)
├── login.html        # 로그인 화면
├── register.html     # 회원가입 화면
├── logs.html         # 대화 로그 및 통계 검증 센터
├── css/
│   └── style.css     # 스크롤바, 마크다운 렌더링 및 커스텀 스타일
├── js/
│   ├── config.js     # 백엔드 API Base URL 및 전역 설정
│   ├── api.js        # 공통 Fetch 래퍼, 토큰 관리, Toast 알림
│   ├── auth.js       # 로그인 / 회원가입 핸들러
│   ├── chat.js       # SSE 스트리밍 수신, 세션 CRUD, 메시지 렌더링
│   └── logs.js       # 대화 로그 조회, 메트릭 집계, 필터링
└── README.md
```

---

## 🚀 실행 방법

별도의 `npm install`이나 복잡한 빌드 과정 없이 정적 웹 서버로 즉시 실행할 수 있습니다.

### 방법 1. VS Code Live Server 확장 프로그램
1. VS Code에서 `chat-fe` 폴더를 엽니다.
2. `index.html` 파일을 우클릭하고 **"Open with Live Server"**를 클릭합니다.

### 방법 2. Python 내장 HTTP 서버
```bash
# chat-fe 디렉토리에서 실행
python -m http.server 3000
```
브라우저에서 `http://localhost:3000`으로 접속합니다.

### 방법 3. Node.js `serve` / `http-server`
```bash
npx serve .
```

---

## ⚙️ 백엔드 연동 설정 (`js/config.js`)

`js/config.js`는 localhost/127.0.0.1/IPv6 loopback에서 로컬 API(`http://localhost:8000`)를 사용합니다. 외부 배포에서는 아래 EC2 백엔드 HTTPS 주소를 사용합니다:

```javascript
const DEPLOYED_API_BASE_URL = 'https://b71chatbe.ddns.net';
```

---

백엔드 주소를 변경할 때는 이 한 값을 수정하고 마지막 `/`나 `/api/v1` 경로를 붙이지 않습니다. 주소가 비어 있으면 외부 사이트에서 요청을 보내지 않고 연결 준비 안내를 표시합니다. 로컬 HTTP 주소로 자동 연결하지 않습니다. 현재 백엔드는 실제 AI 키 없이 Mock 응답을 반환합니다.

정적 HTML/JS 프로젝트이므로 Vercel 환경 변수에 같은 이름을 입력하는 것만으로 이 값이 바뀌지는 않습니다. 별도 빌드 도구 없이 코드의 한 값으로 관리합니다. 다른 기기의 LAN 접속은 자동 로컬 판별 대상이 아닙니다.

## 회원가입 연동

- 아이디 3~30자, 닉네임 1~30자, 비밀번호 8~100자와 비밀번호 확인을 입력합니다.
- 아이디·닉네임 앞뒤 공백을 제거하며 공백뿐인 닉네임과 짧은 비밀번호는 요청 전에 안내합니다.
- `/api/v1/auth/register`에 `{ username, nickname, password }`를 전송합니다. 닉네임은 BE의 필수 필드입니다.
- 기존 계정의 로그인 요청은 `{ username, password }`를 그대로 사용합니다.

## Vercel 배포

GitHub로 가입한 Hobby 프로젝트에서 이 프론트 레포를 연결합니다. Framework는 Other, 루트는 레포 루트, 빌드는 없음, Output은 `.`입니다. Production Branch는 필요한 변경이 반영된 브랜치로 선택합니다. 현재 수정은 `dev/log-frontend-integration`에서 작업하며 main/develop에 직접 변경하지 않습니다.

현재 백엔드 주소는 `https://b71chatbe.ddns.net`이며, Vercel 프론트 URL은 프로젝트 연결·배포 후 기록합니다. 로컬 미커밋 수정은 GitHub 연결 배포에 포함되지 않으므로 필요한 변경을 배포 브랜치에 먼저 반영합니다.

배포 후 실제 Vercel Origin으로 백엔드 CORS 동작을 확인하고 필요한 경우 허용 출처를 반영합니다. API 키나 JWT 비밀키는 프론트에 넣지 않습니다. BE main 통합 PR을 병합해도 FE 코드가 자동 반영되지는 않습니다.

## 🔐 인증 및 보안
- 로그인 성공 시 발급받은 JWT 토큰(`access_token`)은 `localStorage`에 저장됩니다. 스크립트에서 접근 가능한 저장소이므로 토큰을 공유하거나 실제 비밀키를 넣지 않습니다.
- 모든 API 요청 시 `Authorization: Bearer <token>` 헤더로 백엔드에 자동 전달됩니다.
- 토큰이 만료되거나 유효하지 않은 경우 자동으로 `login.html`로 이동합니다.
