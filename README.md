# 현장노트 — 건설 지식 AI 어시스턴트

건설 용어와 시공 원리를 질문하고, 답변과 이전 대화를 다시 확인하는 정적 웹 프론트입니다. 로그인·회원가입, 채팅 세션, SSE 답변, 개인 대화 기록을 FastAPI 백엔드와 연결합니다.

## 실행

별도 의존성 설치나 빌드 없이 `chat-fe` 폴더에서 정적 웹 서버를 실행합니다.

```bash
python -m http.server 3000
```

http://localhost:3000 에 접속합니다. 로컬 백엔드는 http://localhost:8000 에서 실행합니다.

## 화면과 구성

- `index.html`: 최근 대화, 건설 주제 질문, 실시간 답변과 답변 복사.
- `logs.html`: 전체 질문·대화 통계, 상태 필터, 현재 페이지 검색, 50개 단위 페이지 이동, 질문·답변 전체 내용 보기.
- `login.html` / `register.html`: 계정 인증, 닉네임 입력, 비밀번호 확인·표시.
- `css/style.css`: 밝은 종이색과 녹색의 공통 디자인, 모바일 메뉴, 키보드 포커스, 모션 감소 설정.
- `js/config.js`: 로컬·배포 API 주소 선택.
- `js/api.js` / `js/auth.js`: 기존 JWT 인증과 가입·로그인 요청.
- `js/ui.js`: 공통 UI, 시간 표시, Markdown 정제.
- `js/chat.js` / `js/logs.js`: 세션·SSE와 개인 기록 조회.

Vanilla HTML/CSS/JavaScript를 사용합니다. 빌드 의존성은 없습니다. 글꼴·Font Awesome·Marked 12.0.2·DOMPurify 3.4.16은 CDN에서 로드합니다. Markdown 라이브러리를 사용할 수 없으면 답변을 이스케이프한 일반 텍스트로 표시합니다. 서버에서 생성된 Markdown은 HTML로 변환한 뒤 정제합니다.

## 백엔드 연결

`js/config.js`는 localhost·127.0.0.1·IPv6 loopback에서 로컬 API를 사용하고, 외부 배포에서는 다음 주소를 사용합니다.

```javascript
const DEPLOYED_API_BASE_URL = 'https://b71chatbe.ddns.net';
```

끝에 `/api/v1`을 붙이지 않습니다. 정적 JS이므로 Vercel 환경 변수만 입력해서 이 값이 바뀌지는 않습니다. API 키와 JWT 서명 키는 EC2 백엔드에만 둡니다.

회원가입은 `{ username, nickname, password }`, 로그인은 `{ username, password }`를 전송합니다. 아이디는 3~30자, 닉네임은 1~30자, 비밀번호는 8~100자입니다. 인증 토큰은 기존 저장 키 `chat_access_token`을 유지하고 API 요청에 Bearer 헤더로 전달합니다. 로그 검색·질문/답변 탭은 현재 페이지를 대상으로 하며, 상태 필터·페이지 이동은 서버 API를 사용합니다. 통계는 `/api/v1/logs/stats`의 전체 계정 통계를 사용합니다.

## 배포와 협업

- 프론트 Production: https://b7-1-chat-fe.vercel.app
- 백엔드 HTTPS: https://b71chatbe.ddns.net
- Vercel: 개인 Hobby, Framework Other, 저장소 루트, 빌드 없음, Output `.`.
- 현재 Production 추적 브랜치: `dev/log-frontend-integration`. 해당 브랜치에 푸시하면 자동 배포될 수 있습니다.
- 팀 합의: 개인 작업 브랜치에서 수정 후 `develop` 대상 PR을 만들고 감독 `dolphin1404`를 리뷰어로 지정합니다. `develop → main` 병합은 감독이 수행합니다.

2026-10-04 기존 배포 `6fd410e`의 공개 파일과 CORS를 Codex가 확인했습니다. 이후 사용자가 가입·로그인·Demo 질문·로그 재조회, 서버 키 입력 후 실제 AI 답변과 후속 질문 문맥·로그 화면을 확인했습니다. 이번 화면 개편의 브라우저 검증은 격리된 로컬 데이터로 수행합니다. 재배포 뒤 실제 서버 회귀 확인과 구분합니다.

화면 예시와 리뷰 안내는 [UI 리뷰 안내](docs/ui-review.md)를 참고하세요.
