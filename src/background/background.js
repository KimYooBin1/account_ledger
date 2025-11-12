// Background Service Worker (Manifest V3)
// 메시지 처리, Firestore 연동, 알람 기능 구현

import {
  initializeFirebase,
  getDatabase,
  getAccountsCollectionPath,
  getCurrentUserId,
} from "../config/firebase-init.js";

let isInitialized = false;

// Firebase 초기화
async function ensureFirebaseInitialized() {
  if (!isInitialized) {
    await initializeFirebase();
    isInitialized = true;
  }
}

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed:", details.reason);

  try {
    await ensureFirebaseInitialized();

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
    return true; // 비동기 응답을 위해 true 반환
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

// 이벤트 감지 처리 (회원가입, 로그인, 비밀번호 변경)
async function handleEventDetection(message, sender) {
  await ensureFirebaseInitialized();

  const { action, domain } = message;
  const db = getDatabase();
  const { doc, setDoc, updateDoc, getDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  const collectionPath = getAccountsCollectionPath();
  const docRef = doc(db, collectionPath, domain);

  try {
    const docSnap = await getDoc(docRef);
    const currentTime = new Date().toISOString();

    if (action === "SIGNUP") {
      // 회원가입 감지
      if (!docSnap.exists()) {
        await setDoc(docRef, {
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
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          lastLoginDate: currentTime,
        });
      } else {
        // 계정이 없으면 새로 생성
        await setDoc(docRef, {
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
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          lastPasswordChangeDate: currentTime,
          isWarning: false, // 비밀번호 변경 시 경고 해제
        });
      } else {
        await setDoc(docRef, {
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
  await ensureFirebaseInitialized();

  const db = getDatabase();
  const { collection, getDocs } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  const collectionPath = getAccountsCollectionPath();
  const querySnapshot = await getDocs(collection(db, collectionPath));

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
  await ensureFirebaseInitialized();

  const db = getDatabase();
  const { doc, updateDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  const collectionPath = getAccountsCollectionPath();
  const docRef = doc(db, collectionPath, domain);

  await updateDoc(docRef, updates);
  return { domain, updates };
}

// 계정 삭제
async function deleteAccount(domain) {
  await ensureFirebaseInitialized();

  const db = getDatabase();
  const { doc, deleteDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  const collectionPath = getAccountsCollectionPath();
  const docRef = doc(db, collectionPath, domain);

  await deleteDoc(docRef);
  return { domain };
}

// 알람 처리 (비밀번호 만료 검사)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "check_password_expiry") {
    console.log("Checking password expiry...");
    await checkPasswordExpiry();
  }
});

// 비밀번호 만료 검사
async function checkPasswordExpiry() {
  try {
    await ensureFirebaseInitialized();

    // 설정에서 비밀번호 변경 주기 가져오기
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
