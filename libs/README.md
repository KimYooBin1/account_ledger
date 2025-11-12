# Firebase SDK 라이브러리

이 폴더에는 Chrome Extension의 Content Security Policy(CSP)를 준수하기 위해 로컬에 다운로드된 Firebase SDK 파일들이 포함되어 있습니다.

## 파일 목록

- `firebase-app-compat.js` - Firebase App (Core)
- `firebase-auth-compat.js` - Firebase Authentication
- `firebase-firestore-compat.js` - Firebase Firestore

## 버전

Firebase SDK v10.7.1 (Compat 버전)

## 사용 이유

Chrome Extension의 Service Worker는 다음과 같은 이유로 외부 CDN에서 스크립트를 로드할 수 없습니다:

```
Refused to load the script 'https://www.gstatic.com/...' because it violates
the following Content Security Policy directive: "script-src 'self'"
```

따라서 Firebase SDK 파일을 로컬에 포함시켜야 합니다.

## 업데이트 방법

Firebase SDK를 업데이트하려면:

```bash
cd libs

# 새 버전 다운로드 (예: v10.8.0)
VERSION="10.8.0"
curl -sL -o firebase-app-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-app-compat.js
curl -sL -o firebase-auth-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth-compat.js
curl -sL -o firebase-firestore-compat.js https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore-compat.js
```

## 참고

- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Chrome Extension CSP](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
