// Background Service Worker (Manifest V3)
// Firebase SDK를 importScripts로 로드

// Firebase SDK 로드 (로컬 파일 - CSP 정책 준수)
importScripts("/libs/firebase-app-compat.js");
importScripts("/libs/firebase-auth-compat.js");
importScripts("/libs/firebase-firestore-compat.js");

// Firebase 설정 로드
importScripts("/firebase-config.js");

let isInitialized = false;
let db = null;
let auth = null;

// Firebase 초기화
async function initializeFirebase() {
  if (isInitialized) {
    return { db, auth };
  }

  try {
    // Firebase 앱 초기화
    const app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    // 익명 로그인
    await auth.signInAnonymously();
    console.log("Firebase initialized and signed in anonymously");
    console.log("User ID:", auth.currentUser.uid);

    isInitialized = true;
    return { db, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// 현재 사용자 ID 가져오기
function getCurrentUserId() {
  if (!auth || !auth.currentUser) {
    throw new Error("User not authenticated");
  }
  return auth.currentUser.uid;
}

// 계정 컬렉션 경로 가져오기
function getAccountsCollectionPath() {
  const userId = getCurrentUserId();
  return `users/${userId}/accounts`;
}

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed:", details.reason);

  try {
    await initializeFirebase();

    // 주기적 알람 설정 (매일 1회 비밀번호 만료 검사)
    chrome.alarms.create("check_password_expiry", {
      periodInMinutes: 60 * 24, // 24시간마다
    });

    // 기본 설정 저장
    chrome.storage.sync.set({
      passwordChangePeriod: 90, // 기본 90일
      notificationsEnabled: true,
    });

    console.log("Background service initialized");
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// Content Script로부터 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);

  if (message.type === "EVENT_DETECTED") {
    handleEventDetection(message, sender)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 비동기 응답
  }

  if (message.type === "GET_ACCOUNTS") {
    getAccounts()
      .then((accounts) => sendResponse({ success: true, accounts }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === "UPDATE_ACCOUNT") {
    updateAccount(message.domain, message.updates)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === "DELETE_ACCOUNT") {
    deleteAccount(message.domain)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 이벤트 감지 처리
async function handleEventDetection(message, sender) {
  await initializeFirebase();

  const { action, domain } = message;
  const collectionPath = getAccountsCollectionPath();
  const docRef = db.collection(collectionPath).doc(domain);

  try {
    const docSnap = await docRef.get();
    const currentTime = new Date().toISOString();

    if (action === "SIGNUP") {
      // 회원가입 감지
      if (!docSnap.exists) {
        await docRef.set({
          domain: domain,
          signUpDate: currentTime,
          lastLoginDate: currentTime,
          lastPasswordChangeDate: currentTime,
          isWarning: false,
          createdAt: currentTime,
        });
        console.log(`New account registered: ${domain}`);
      }
    } else if (action === "LOGIN") {
      // 로그인 감지
      if (docSnap.exists) {
        await docRef.update({
          lastLoginDate: currentTime,
        });
      } else {
        // 계정이 없으면 새로 생성
        await docRef.set({
          domain: domain,
          signUpDate: currentTime,
          lastLoginDate: currentTime,
          lastPasswordChangeDate: null,
          isWarning: false,
          createdAt: currentTime,
        });
      }
      console.log(`Login recorded: ${domain}`);
    } else if (action === "PASS_CHANGE") {
      // 비밀번호 변경 감지
      if (docSnap.exists) {
        await docRef.update({
          lastPasswordChangeDate: currentTime,
          isWarning: false,
        });
      } else {
        await docRef.set({
          domain: domain,
          signUpDate: null,
          lastLoginDate: null,
          lastPasswordChangeDate: currentTime,
          isWarning: false,
          createdAt: currentTime,
        });
      }
      console.log(`Password change recorded: ${domain}`);
    }

    return { domain, action, timestamp: currentTime };
  } catch (error) {
    console.error("Error handling event:", error);
    throw error;
  }
}

// 모든 계정 가져오기
async function getAccounts() {
  await initializeFirebase();

  const collectionPath = getAccountsCollectionPath();
  const querySnapshot = await db.collection(collectionPath).get();

  const accounts = [];
  querySnapshot.forEach((doc) => {
    accounts.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return accounts;
}

// 계정 업데이트
async function updateAccount(domain, updates) {
  await initializeFirebase();

  const collectionPath = getAccountsCollectionPath();
  const docRef = db.collection(collectionPath).doc(domain);

  await docRef.update(updates);

  // 업데이트 후 즉시 경고 상태 체크
  await checkSingleAccountExpiry(domain);

  return { domain, updates };
}

// 단일 계정의 비밀번호 만료 상태 체크
async function checkSingleAccountExpiry(domain) {
  try {
    await initializeFirebase();

    // 설정 가져오기
    const settings = await chrome.storage.sync.get(["passwordChangePeriod"]);
    const period = settings.passwordChangePeriod || 90;

    // 계정 정보 가져오기
    const collectionPath = getAccountsCollectionPath();
    const docRef = db.collection(collectionPath).doc(domain);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return;
    }

    const account = docSnap.data();
    const now = new Date();

    // 비밀번호 변경일이 있는 경우만 체크
    if (account.lastPasswordChangeDate) {
      const lastChange = new Date(account.lastPasswordChangeDate);
      const daysSinceChange = Math.floor(
        (now - lastChange) / (1000 * 60 * 60 * 24)
      );

      const shouldWarn = daysSinceChange >= period;

      // 현재 경고 상태와 다르면 업데이트
      if (account.isWarning !== shouldWarn) {
        await docRef.update({ isWarning: shouldWarn });
        console.log(`Warning status updated for ${domain}: ${shouldWarn}`);
      }
    }
  } catch (error) {
    console.error("Error checking single account expiry:", error);
  }
}

// 계정 삭제
async function deleteAccount(domain) {
  await initializeFirebase();

  const collectionPath = getAccountsCollectionPath();
  const docRef = db.collection(collectionPath).doc(domain);

  await docRef.delete();
  return { domain };
}

// 알람 처리
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "check_password_expiry") {
    console.log("Checking password expiry...");
    await checkPasswordExpiry();
  }
});

// 비밀번호 만료 검사
async function checkPasswordExpiry() {
  try {
    await initializeFirebase();

    // 설정 가져오기
    const settings = await chrome.storage.sync.get([
      "passwordChangePeriod",
      "notificationsEnabled",
    ]);
    const period = settings.passwordChangePeriod || 90;
    const notificationsEnabled = settings.notificationsEnabled !== false;

    if (!notificationsEnabled) {
      return;
    }

    // 모든 계정 가져오기
    const accounts = await getAccounts();
    const now = new Date();
    const expiredAccounts = [];

    for (const account of accounts) {
      if (account.lastPasswordChangeDate) {
        const lastChange = new Date(account.lastPasswordChangeDate);
        const daysSinceChange = Math.floor(
          (now - lastChange) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceChange >= period) {
          expiredAccounts.push({
            domain: account.domain,
            daysSinceChange,
          });

          // isWarning 플래그 업데이트
          await updateAccount(account.domain, { isWarning: true });
        }
      }
    }

    // 만료된 계정이 있으면 알림 표시
    if (expiredAccounts.length > 0) {
      const domainsText = expiredAccounts.map((a) => a.domain).join(", ");
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icons/icon128.png"),
        title: "비밀번호 변경 알림",
        message: `${expiredAccounts.length}개 사이트의 비밀번호 변경이 필요합니다.\n${domainsText}`,
        priority: 2,
      });
    }

    console.log(
      `Password expiry check completed. ${expiredAccounts.length} expired accounts found.`
    );
  } catch (error) {
    console.error("Error checking password expiry:", error);
  }
}
