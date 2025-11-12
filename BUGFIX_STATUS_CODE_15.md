# 🔧 Service Worker Status Code 15 에러 수정

## 문제

```
Service worker registration failed. Status code: 15
```

**원인**: `importScripts()`의 파일 경로가 잘못됨

## 해결 방법

### 변경사항

#### 1. firebase-config.js 위치 변경

```
❌ 이전: src/background/firebase-config.js
✅ 현재: firebase-config.js (프로젝트 루트)
```

#### 2. background.js 수정

```javascript
// ❌ 이전 (상대 경로)
importScripts("firebase-config.js");

// ✅ 현재 (절대 경로)
self.importScripts("/firebase-config.js");
```

**이유**: Chrome Extension의 Service Worker는 확장 프로그램 루트를 기준으로 경로를 해석합니다.

### 프로젝트 구조

```
account_ledger/
├── manifest.json
├── firebase-config.js              ← Service Worker가 로드
├── firebase-config.template.js     ← 템플릿 (git에 포함)
├── src/
│   ├── background/
│   │   └── background.js           ← Service Worker
│   ├── config/
│   │   └── firebase-config.js      ← Popup/Options용 (ES6 module)
│   └── ...
```

## 테스트 방법

### 1단계: 확장 프로그램 새로고침

```bash
1. chrome://extensions/ 접속
2. "새로고침" 버튼 클릭 🔄
```

### 2단계: Service Worker 상태 확인

```bash
chrome://extensions/
→ 확장 프로그램 카드 확인
```

**정상인 경우:**

- ✅ "Service Worker" 링크가 보임 (클릭 가능)
- ✅ 에러 메시지 없음

**에러인 경우:**

- ❌ "Service worker registration failed" 표시
- ❌ Status code 표시

### 3단계: Service Worker Console 확인

```bash
1. "Service Worker" 클릭
2. Console 탭 확인
```

**예상 로그:**

```
✅ Firebase initialized and signed in anonymously
✅ User ID: [자동생성된ID]
✅ Background service initialized
```

### 4단계: 실제 테스트

```bash
# 방법 1: 테스트 페이지
open test_page.html

# 방법 2: 실제 웹사이트
# GitHub 로그인 페이지 등 방문
```

## Firebase 설정

### 처음 설정하는 경우

**firebase-config.js 파일 편집:**

```javascript
const firebaseConfig = {
  apiKey: "실제_API_키를_여기에_입력",
  authDomain: "프로젝트ID.firebaseapp.com",
  projectId: "프로젝트ID",
  storageBucket: "프로젝트ID.appspot.com",
  messagingSenderId: "숫자ID",
  appId: "앱ID",
};
```

### 템플릿에서 생성하는 경우

```bash
# 터미널에서 실행
cd /Users/kim-yubin/Desktop/project/account_ledger
cp firebase-config.template.js firebase-config.js

# 에디터에서 firebase-config.js 열고 값 입력
code firebase-config.js  # 또는 다른 에디터
```

## 일반적인 Service Worker 에러 해결

### Status Code 15

- **원인**: 스크립트 파일을 찾을 수 없음
- **해결**: 파일 경로 확인, 파일 존재 여부 확인

### Status Code 3

- **원인**: 스크립트 파싱 에러 (문법 오류)
- **해결**: JavaScript 문법 확인

### "Service Worker" 링크가 안 보임

- **원인**: 등록 자체가 실패
- **해결**: manifest.json의 background 설정 확인

## 체크리스트

**Service Worker 정상 작동 확인:**

```
[ ] chrome://extensions/에서 에러 메시지 없음
[ ] "Service Worker" 링크 클릭 가능
[ ] Console에 "Firebase initialized" 메시지 표시
[ ] Console에 에러 없음
[ ] test_page.html에서 이벤트 감지 테스트
[ ] 팝업/옵션 페이지 정상 작동
```

## 추가 디버깅

### Chrome DevTools에서 직접 확인

```
1. chrome://inspect/#service-workers
2. 등록된 Service Worker 목록 확인
3. "inspect" 클릭하여 디버깅
```

### 완전히 재설치

```bash
1. chrome://extensions/
2. 확장 프로그램 "제거"
3. Chrome 재시작
4. 다시 "압축해제된 확장 프로그램을 로드합니다"
```

## 관련 문서

- [BUGFIX_SERVICE_WORKER.md](BUGFIX_SERVICE_WORKER.md) - 이전 import() 에러 수정
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - 전체 테스트 가이드
- [QUICKSTART.md](QUICKSTART.md) - 빠른 시작

---

✅ **수정 완료!** 이제 Service Worker가 정상적으로 등록되어야 합니다.

**다음 단계:**

1. Chrome에서 확장 프로그램 새로고침
2. Service Worker Console 확인
3. 테스트 실행
