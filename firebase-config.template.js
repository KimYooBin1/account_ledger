// Firebase Configuration Template
// ⚠️ 이 파일을 복사하여 firebase-config.js로 저장하고 실제 값을 입력하세요
// Firebase Console: https://console.firebase.google.com/

// ✅ 설정 방법:
// 1. 이 파일을 복사: cp firebase-config.template.js firebase-config.js
// 2. firebase-config.js 파일 열기
// 3. 아래 값들을 Firebase Console에서 복사한 값으로 변경
// 4. 저장

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Firebase Console에서 복사
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // 프로젝트 ID 입력
  projectId: "YOUR_PROJECT_ID", // 프로젝트 ID 입력
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // 프로젝트 ID 입력
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // 숫자 ID
  appId: "YOUR_APP_ID", // 앱 ID
};

// Firestore 컬렉션 경로 설정
const FIRESTORE_PATHS = {
  // accounts 컬렉션 경로 (사용자별)
  getAccountsPath: (userId) => `users/${userId}/accounts`,
};

// 기본 비밀번호 변경 주기 (일)
const DEFAULT_PASSWORD_CHANGE_PERIOD = 90;
