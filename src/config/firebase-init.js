// Firebase SDK 초기화 및 유틸리티 함수
import { firebaseConfig, FIRESTORE_PATHS } from "./firebase-config.js";

// Firebase SDK를 동적으로 로드
let firebaseApp = null;
let auth = null;
let db = null;

// Firebase 초기화
export async function initializeFirebase() {
  try {
    // Firebase SDK 임포트 (CDN 방식)
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
    );
    const { getAuth, signInAnonymously } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
    );
    const { getFirestore } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
    );

    // Firebase 앱 초기화
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);

    // 익명 로그인
    await signInAnonymously(auth);
    console.log("Firebase initialized and signed in anonymously");

    return { app: firebaseApp, auth, db };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Firestore 데이터베이스 가져오기
export function getDatabase() {
  if (!db) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first."
    );
  }
  return db;
}

// 인증 객체 가져오기
export function getAuthInstance() {
  if (!auth) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first."
    );
  }
  return auth;
}

// 현재 사용자 ID 가져오기
export function getCurrentUserId() {
  if (!auth || !auth.currentUser) {
    throw new Error("User not authenticated");
  }
  return auth.currentUser.uid;
}

// 계정 컬렉션 경로 가져오기
export function getAccountsCollectionPath() {
  const userId = getCurrentUserId();
  return FIRESTORE_PATHS.getAccountsPath(userId);
}
