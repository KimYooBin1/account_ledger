# 🔧 Service Worker 에러 수정 완료

## 문제

```
Firebase initialization error: TypeError: import() is disallowed on ServiceWorkerGlobalScope
```

Chrome Extension의 Service Worker(background.js)에서는 동적 `import()`를 사용할 수 없습니다.

## 해결 방법

### 1. **manifest.json 수정**

- `"type": "module"` 제거
- Service Worker는 기본 모드로 실행

### 2. **background.js 완전 재작성**

- ❌ ES6 `import` 문법 제거
- ✅ `importScripts()` 사용
- ✅ Firebase Compat SDK 사용

**변경 전:**

```javascript
import { initializeFirebase } from "../config/firebase-init.js";
const { initializeApp } = await import("firebase/app");
```

**변경 후:**

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
importScripts("firebase-config.js");
```

### 3. **firebase-config.js 수정**

- `export` 문법 제거
- 전역 변수로 변경

**변경 전:**

```javascript
export const firebaseConfig = { ... };
```

**변경 후:**

```javascript
const firebaseConfig = { ... };
```

### 4. **파일 위치 조정**

- `firebase-config.js`를 `src/background/` 폴더에 복사
- 이유: `importScripts()`는 Service Worker 파일 기준 상대 경로 사용

## 테스트 방법

### 1단계: 확장 프로그램 새로고침

```bash
1. chrome://extensions/ 접속
2. 확장 프로그램 카드의 "새로고침" 버튼 클릭
```

### 2단계: Service Worker 콘솔 확인

```bash
1. chrome://extensions/
2. "Service Worker" 클릭
3. Console에서 확인:
   ✅ "Firebase initialized and signed in anonymously"
   ✅ "User ID: [사용자ID]"
```

### 3단계: 테스트 페이지 실행

```bash
open test_page.html
# 또는
./test_helper.sh → 옵션 1 선택
```

### 4단계: 이벤트 테스트

```
1. 테스트 페이지에서 로그인 폼 제출
2. F12 Console 확인: "Event recorded: LOGIN for ..."
3. 팝업 열어서 계정 추가 확인
```

## 주요 변경 사항 요약

| 항목          | 변경 전                   | 변경 후           |
| ------------- | ------------------------- | ----------------- |
| Firebase SDK  | Modular (v10)             | Compat (v10)      |
| 로딩 방식     | `import()`                | `importScripts()` |
| manifest type | `"type": "module"`        | 기본 (제거)       |
| 설정 파일     | ES6 export                | 전역 변수         |
| API 사용      | `firebase.auth.getAuth()` | `firebase.auth()` |

## 백업 파일

- `src/background/background.js.backup` - 이전 버전

## 주의사항

### ⚠️ Firebase 설정 필수

`src/background/firebase-config.js` 파일에서 Firebase 설정을 입력해야 합니다:

```javascript
const firebaseConfig = {
  apiKey: "실제_API_KEY",
  authDomain: "프로젝트_ID.firebaseapp.com",
  projectId: "프로젝트_ID",
  storageBucket: "프로젝트_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};
```

### 📝 설정 파일 2개 유지

- `src/config/firebase-config.js` - Popup/Options 페이지용 (ES6 module)
- `src/background/firebase-config.js` - Service Worker용 (전역 변수)

두 파일의 내용은 동일하게 유지해야 합니다!

## 에러 확인 체크리스트

- [ ] Service Worker Console에 "Firebase initialized" 메시지 확인
- [ ] 에러 메시지가 없음
- [ ] test_page.html에서 이벤트 감지 확인
- [ ] 팝업에서 계정 목록 표시
- [ ] 옵션 페이지에서 수동 등록 성공

## 추가 도움말

문제가 계속되면:

1. Chrome 재시작
2. 확장 프로그램 완전 제거 후 재설치
3. Service Worker Console에서 상세 에러 확인
4. Firebase Console에서 프로젝트 설정 재확인

---

✅ **수정 완료!** 이제 확장 프로그램이 정상적으로 작동해야 합니다.
