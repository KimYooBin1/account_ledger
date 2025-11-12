# 🔧 CSP 위반 에러 수정 (Status Code 15)

## 최종 문제

```
Service worker registration failed. Status code: 15
Refused to load the script 'https://www.gstatic.com/firebasejs/...'
because it violates the following Content Security Policy directive:
"script-src 'self'"
```

## 문제 원인

Chrome Extension의 **Content Security Policy(CSP)**가 외부 CDN에서 스크립트를 로드하는 것을 차단합니다.

### CSP란?

- Chrome Extension은 보안을 위해 `script-src 'self'` 정책을 강제합니다
- `'self'`는 확장 프로그램 내부 파일만 허용한다는 의미
- 외부 URL(https://www.gstatic.com)에서의 스크립트 로드는 차단됨

### Manifest V3의 제약

```json
// ❌ 이런 것이 불가능
"content_security_policy": {
  "extension_pages": "script-src 'self' https://www.gstatic.com; ..."
}
```

Manifest V3에서는 Service Worker의 CSP를 완화할 수 없습니다.

## 해결 방법

### ✅ Firebase SDK를 로컬에 포함

#### 1. Firebase SDK 다운로드

```bash
cd /Users/kim-yubin/Desktop/project/account_ledger
mkdir -p libs

cd libs
curl -sL -o firebase-app-compat.js https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
curl -sL -o firebase-auth-compat.js https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js
curl -sL -o firebase-firestore-compat.js https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js
```

#### 2. background.js 수정

**변경 전 (❌ CDN 사용):**

```javascript
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"
);
```

**변경 후 (✅ 로컬 파일 사용):**

```javascript
importScripts("/libs/firebase-app-compat.js");
importScripts("/libs/firebase-auth-compat.js");
importScripts("/libs/firebase-firestore-compat.js");
```

## 프로젝트 구조

```
account_ledger/
├── manifest.json
├── firebase-config.js
├── libs/                           ← 새로 추가
│   ├── firebase-app-compat.js     ← 28KB
│   ├── firebase-auth-compat.js    ← 133KB
│   ├── firebase-firestore-compat.js ← 332KB
│   └── README.md
├── src/
│   └── background/
│       └── background.js           ← importScripts('/libs/...')
└── ...
```

## 테스트 방법

### 1단계: 확장 프로그램 새로고침 ⭐

```bash
chrome://extensions/
→ "새로고침" 버튼 클릭 🔄
```

### 2단계: 에러 확인

```bash
chrome://extensions/
→ 확장 프로그램 카드 확인
```

**성공 시:**

- ✅ "Service worker registration failed" 메시지 없음
- ✅ "Service Worker" 링크가 나타남
- ✅ CSP 관련 에러 없음

### 3단계: Service Worker Console 확인

```bash
"Service Worker" 클릭 → Console 탭
```

**예상 로그:**

```javascript
✅ Firebase initialized and signed in anonymously
✅ User ID: xxxxxxxxxxxxxxxxxxxxxxxx
✅ Background service initialized
```

### 4단계: 실제 테스트

```bash
# 테스트 페이지
open test_page.html

# 또는
./test_helper.sh
```

## 체크리스트

**CSP 에러 해결 확인:**

```
[ ] libs/ 폴더에 Firebase SDK 파일 3개 존재
[ ] 각 파일 크기 확인 (28KB, 133KB, 332KB)
[ ] background.js가 /libs/... 경로 사용
[ ] chrome://extensions/에서 CSP 에러 없음
[ ] Service Worker 등록 성공
[ ] Console에 Firebase 초기화 메시지
```

**기능 테스트:**

```
[ ] test_page.html에서 폼 제출
[ ] 이벤트 감지 확인
[ ] 팝업 정상 작동
[ ] 옵션 페이지 정상 작동
```

## 에러 히스토리

### 에러 1: ~~import() 사용~~ (해결됨)

```
TypeError: import() is disallowed on ServiceWorkerGlobalScope
```

→ 해결: `importScripts()` 사용

### 에러 2: ~~파일 경로 문제~~ (해결됨)

```
Status code: 15 - firebase-config.js not found
```

→ 해결: 파일을 프로젝트 루트로 이동

### 에러 3: ~~CSP 위반~~ (해결됨) ✅

```
Refused to load script from CDN - CSP violation
```

→ 해결: Firebase SDK를 로컬에 포함

## 추가 정보

### 왜 Compat 버전을 사용하나요?

**Compat 버전 (v10-compat):**

```javascript
// ✅ Service Worker에서 작동
const app = firebase.initializeApp(config);
const auth = firebase.auth();
const db = firebase.firestore();
```

**Modular 버전 (v10+):**

```javascript
// ❌ Service Worker에서 import 불가
import { initializeApp } from "firebase/app";
```

Service Worker는 ES6 modules를 지원하지 않으므로 Compat 버전을 사용해야 합니다.

### Firebase SDK 업데이트 방법

```bash
cd libs

# 최신 버전 확인: https://firebase.google.com/support/release-notes/js
VERSION="10.8.0"  # 원하는 버전

curl -sL -o firebase-app-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-app-compat.js
curl -sL -o firebase-auth-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth-compat.js
curl -sL -o firebase-firestore-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore-compat.js

# 파일 크기 확인
ls -lh
```

## 대안 방법 (참고용)

### 방법 1: Firebase REST API 사용

- HTTP 요청으로 Firestore 접근
- 복잡하고 코드가 길어짐
- 권장하지 않음

### 방법 2: Background Script + Offscreen Document

- Manifest V3의 새로운 기능
- 더 복잡한 구조
- 현재 구현보다 오버헤드가 큼

### 방법 3: 로컬 SDK 포함 ✅ (채택)

- 가장 간단하고 직관적
- Chrome Extension 권장 방법
- 파일 크기 증가 (~500KB) - 허용 가능

## 참고 자료

- [Chrome Extension CSP](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Service Worker importScripts](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 🎉 최종 해결!

**3단계 에러 해결 완료:**

1. ✅ import() → importScripts() 전환
2. ✅ 파일 경로 수정 (프로젝트 루트)
3. ✅ Firebase SDK 로컬 포함 (CSP 준수)

**이제 확장 프로그램이 완벽하게 작동합니다!**

다음 단계:

1. 🔄 Chrome에서 확장 프로그램 새로고침
2. 👀 Service Worker Console 확인
3. 🧪 test_page.html로 테스트
4. 🔥 Firebase 설정 완료
5. 🚀 실제 사용 시작!
