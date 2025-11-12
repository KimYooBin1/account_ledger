// Firebase Configuration
// ⚠️ 사용자 설정 필요: Firebase Console에서 프로젝트를 생성하고 아래 값을 입력하세요
// Firebase Console: https://console.firebase.google.com/

export const firebaseConfig = {
  apiKey: "AIzaSyB5C8bBwZtdMUEznsTtNLGOuWwgMAjeV34",
  authDomain: "account-ledger-86acf.firebaseapp.com",
  projectId: "account-ledger-86acf",
  storageBucket: "account-ledger-86acf.firebasestorage.app",
  messagingSenderId: "488042367239",
  appId: "1:488042367239:web:b0dbf7c7a79d29ce065da2",
  measurementId: "G-JP2N73FLYF",
};

// Firestore 컬렉션 경로 설정
export const FIRESTORE_PATHS = {
  // accounts 컬렉션 경로 (사용자별)
  getAccountsPath: (userId) => `users/${userId}/accounts`,
};

// 기본 비밀번호 변경 주기 (일)
export const DEFAULT_PASSWORD_CHANGE_PERIOD = 90;
