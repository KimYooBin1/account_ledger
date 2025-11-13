// Popup JavaScript
console.log("Popup script loaded");

let currentDomain = "";
let allAccounts = [];

// 메인 도메인 추출 (서브도메인 제거)
function extractMainDomain(hostname) {
  // www. 제거
  hostname = hostname.replace(/^www\./, "");

  // IP 주소인 경우 그대로 반환
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname;
  }

  // localhost 등 단일 단어 도메인
  if (!hostname.includes(".")) {
    return hostname;
  }

  // 도메인 부분 분리
  const parts = hostname.split(".");

  // 최소 2개 부분 필요 (domain.com)
  if (parts.length < 2) {
    return hostname;
  }

  // 2단계 TLD 처리 (co.kr, com.au 등)
  const twoLevelTLDs = [
    "co",
    "com",
    "net",
    "org",
    "edu",
    "gov",
    "ac",
    "or",
    "ne",
    "go",
  ];
  if (parts.length >= 3 && twoLevelTLDs.includes(parts[parts.length - 2])) {
    // example.co.kr -> example.co.kr
    return parts.slice(-3).join(".");
  }

  // 일반적인 경우: 마지막 2개 부분만 반환 (example.com)
  return parts.slice(-2).join(".");
}

// 현재 탭의 도메인 가져오기
async function getCurrentTabDomain() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      return extractMainDomain(url.hostname);
    }
  } catch (error) {
    console.error("Error getting current tab:", error);
  }
  return null;
}

// 모든 계정 가져오기
async function loadAccounts() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "GET_ACCOUNTS" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response && response.success) {
        resolve(response.accounts || []);
      } else {
        reject(new Error(response?.error || "Failed to load accounts"));
      }
    });
  });
}

// 현재 도메인의 계정 정보 표시
async function displayCurrentAccount() {
  const domain = await getCurrentTabDomain();
  currentDomain = domain;

  // 도메인 표시
  document.getElementById("currentDomain").textContent = domain || "알 수 없음";

  if (!domain) {
    document.getElementById("loadingStatus").classList.add("hidden");
    document.getElementById("noAccountInfo").classList.remove("hidden");
    return;
  }

  try {
    // 모든 계정 로드
    allAccounts = await loadAccounts();

    // 현재 도메인 찾기
    const account = allAccounts.find((acc) => acc.domain === domain);

    document.getElementById("loadingStatus").classList.add("hidden");

    if (account) {
      // 계정 정보 표시
      document.getElementById("accountInfo").classList.remove("hidden");
      document.getElementById("noAccountInfo").classList.add("hidden");

      // 날짜 포맷팅
      const formatDate = (dateStr) => {
        if (!dateStr) return "기록 없음";
        try {
          const date = new Date(dateStr);
          return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          return dateStr;
        }
      };

      document.getElementById("signUpDate").textContent = formatDate(
        account.signUpDate
      );
      document.getElementById("lastLoginDate").textContent = formatDate(
        account.lastLoginDate
      );
      document.getElementById("lastPasswordChangeDate").textContent =
        formatDate(account.lastPasswordChangeDate);

      // 경고 표시
      if (account.isWarning) {
        document.getElementById("warningAlert").classList.remove("hidden");
      } else {
        document.getElementById("warningAlert").classList.add("hidden");
      }
    } else {
      // 계정 없음
      document.getElementById("accountInfo").classList.add("hidden");
      document.getElementById("noAccountInfo").classList.remove("hidden");
      document.getElementById("warningAlert").classList.add("hidden");
    }

    // 통계 업데이트
    updateStats();
  } catch (error) {
    console.error("Error loading account:", error);
    document.getElementById("loadingStatus").classList.add("hidden");
    document.getElementById("noAccountInfo").classList.remove("hidden");
  }
}

// 통계 업데이트
function updateStats() {
  const totalAccounts = allAccounts.length;
  const warningAccounts = allAccounts.filter((acc) => acc.isWarning).length;

  document.getElementById("totalAccounts").textContent = totalAccounts;
  document.getElementById("warningAccounts").textContent = warningAccounts;
}

// 계정 업데이트
async function updateAccount(field, value) {
  if (!currentDomain) return;

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "UPDATE_ACCOUNT",
        domain: currentDomain,
        updates: { [field]: value },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || "Failed to update account"));
        }
      }
    );
  });
}

// 현재 계정 등록
async function registerCurrentAccount() {
  if (!currentDomain) return;

  try {
    // SIGNUP 이벤트로 전송
    chrome.runtime.sendMessage(
      {
        type: "EVENT_DETECTED",
        action: "SIGNUP",
        domain: currentDomain,
      },
      (response) => {
        if (response && response.success) {
          // 화면 새로고침
          setTimeout(() => {
            displayCurrentAccount();
          }, 500);
        }
      }
    );
  } catch (error) {
    console.error("Error registering account:", error);
    alert("계정 등록 중 오류가 발생했습니다.");
  }
}

// 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
  // 초기 로드
  displayCurrentAccount();

  // 로그인 시간 업데이트
  document
    .getElementById("updateLoginBtn")
    ?.addEventListener("click", async () => {
      try {
        await updateAccount("lastLoginDate", new Date().toISOString());
        displayCurrentAccount();
      } catch (error) {
        console.error("Error updating login date:", error);
        alert("업데이트 중 오류가 발생했습니다.");
      }
    });

  // 비밀번호 변경일 업데이트
  document
    .getElementById("updatePasswordBtn")
    ?.addEventListener("click", async () => {
      try {
        await updateAccount("lastPasswordChangeDate", new Date().toISOString());
        await updateAccount("isWarning", false);
        displayCurrentAccount();
      } catch (error) {
        console.error("Error updating password date:", error);
        alert("업데이트 중 오류가 발생했습니다.");
      }
    });

  // 지금 등록하기
  document.getElementById("registerNowBtn")?.addEventListener("click", () => {
    registerCurrentAccount();
  });

  // 옵션 페이지 열기
  document.getElementById("openOptionsBtn")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
