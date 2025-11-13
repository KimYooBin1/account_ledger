// Options Page JavaScript
console.log("Options page loaded");

let allAccounts = [];
let currentEditingDomain = null;

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

// 설정 로드
async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    "passwordChangePeriod",
    "notificationsEnabled",
  ]);
  return {
    passwordChangePeriod: settings.passwordChangePeriod || 90,
    notificationsEnabled: settings.notificationsEnabled !== false,
  };
}

// 통계 업데이트
function updateStats() {
  const totalAccounts = allAccounts.length;
  const warningAccounts = allAccounts.filter((acc) => acc.isWarning).length;

  document.getElementById("totalAccounts").textContent = totalAccounts;
  document.getElementById("warningAccounts").textContent = warningAccounts;
}

// 계정 테이블 렌더링
function renderAccountsTable(accounts = allAccounts) {
  const tbody = document.getElementById("accountsTableBody");
  tbody.innerHTML = "";

  if (accounts.length === 0) {
    document.getElementById("loadingState").classList.add("hidden");
    document.getElementById("accountsTableContainer").classList.add("hidden");
    document.getElementById("emptyState").classList.remove("hidden");
    return;
  }

  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("accountsTableContainer").classList.remove("hidden");

  // 날짜 포맷팅
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
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

  // 경고 여부에 따라 정렬 (경고 있는 것 먼저)
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isWarning && !b.isWarning) return -1;
    if (!a.isWarning && b.isWarning) return 1;
    return 0;
  });

  sortedAccounts.forEach((account) => {
    const tr = document.createElement("tr");
    tr.className = account.isWarning ? "bg-red-50" : "hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <a href="https://${
            account.domain
          }" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">
            ${account.domain}
          </a>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ${formatDate(account.signUpDate)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ${formatDate(account.lastLoginDate)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ${formatDate(account.lastPasswordChangeDate)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${
          account.isWarning
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">경고</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">정상</span>'
        }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">
        <div class="flex gap-2">
          <button class="edit-btn px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition" data-domain="${
            account.domain
          }">
            수정
          </button>
          <button class="delete-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition" data-domain="${
            account.domain
          }">
            삭제
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // 버튼 이벤트 리스너 추가
  attachTableEventListeners();
}

// 테이블 버튼 이벤트 리스너
function attachTableEventListeners() {
  // 수정
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const domain = e.target.dataset.domain;
      openEditModal(domain);
    });
  });

  // 삭제
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const domain = e.target.dataset.domain;
      if (confirm(`'${domain}' 계정을 삭제하시겠습니까?`)) {
        await deleteAccount(domain);
        await refreshData();
      }
    });
  });
}

// 계정 업데이트
async function updateAccount(domain, updates) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "UPDATE_ACCOUNT",
        domain: domain,
        updates: updates,
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

// 계정 삭제
async function deleteAccount(domain) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "DELETE_ACCOUNT",
        domain: domain,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || "Failed to delete account"));
        }
      }
    );
  });
}

// 수정 모달 열기
function openEditModal(domain) {
  const account = allAccounts.find((acc) => acc.domain === domain);
  if (!account) return;

  currentEditingDomain = domain;

  document.getElementById("editDomain").value = domain;

  // ISO 형식을 datetime-local 형식으로 변환
  const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  document.getElementById("editSignUpDate").value = toDatetimeLocal(
    account.signUpDate
  );
  document.getElementById("editLastLoginDate").value = toDatetimeLocal(
    account.lastLoginDate
  );
  document.getElementById("editLastPasswordChangeDate").value = toDatetimeLocal(
    account.lastPasswordChangeDate
  );

  document.getElementById("editModal").classList.remove("hidden");
}

// 수정 모달 닫기
function closeEditModal() {
  currentEditingDomain = null;
  document.getElementById("editModal").classList.add("hidden");
}

// 수정 저장
async function saveEdit() {
  if (!currentEditingDomain) return;

  const toISO = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    try {
      return new Date(datetimeLocal).toISOString();
    } catch {
      return null;
    }
  };

  const updates = {
    signUpDate: toISO(document.getElementById("editSignUpDate").value),
    lastLoginDate: toISO(document.getElementById("editLastLoginDate").value),
    lastPasswordChangeDate: toISO(
      document.getElementById("editLastPasswordChangeDate").value
    ),
  };

  try {
    await updateAccount(currentEditingDomain, updates);
    closeEditModal();
    await refreshData();
  } catch (error) {
    console.error("Error saving edit:", error);
    alert("저장 중 오류가 발생했습니다.");
  }
}

// 데이터 새로고침
async function refreshData() {
  try {
    allAccounts = await loadAccounts();
    updateStats();
    renderAccountsTable();

    // 설정 업데이트
    const settings = await loadSettings();
    document.getElementById("currentPeriod").textContent =
      settings.passwordChangePeriod;
    document.getElementById("notificationStatus").textContent =
      settings.notificationsEnabled ? "ON" : "OFF";
    document.getElementById("periodInput").value =
      settings.passwordChangePeriod;
  } catch (error) {
    console.error("Error refreshing data:", error);
  }
}

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

// URL에서 도메인 추출
function extractDomain(url) {
  try {
    // http:// 또는 https://가 없으면 추가
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);
    return extractMainDomain(urlObj.hostname);
  } catch {
    return null;
  }
}

// 수동 계정 등록
async function addManualAccount() {
  const urlInput = document.getElementById("manualUrlInput");
  const url = urlInput.value.trim();

  if (!url) {
    alert("URL을 입력해주세요.");
    return;
  }

  const domain = extractDomain(url);
  if (!domain) {
    alert("유효한 URL을 입력해주세요.");
    return;
  }

  try {
    // SIGNUP 이벤트로 전송
    chrome.runtime.sendMessage(
      {
        type: "EVENT_DETECTED",
        action: "SIGNUP",
        domain: domain,
      },
      async (response) => {
        if (response && response.success) {
          urlInput.value = "";
          await refreshData();
          alert(`${domain}이(가) 등록되었습니다.`);
        } else {
          alert("등록 중 오류가 발생했습니다.");
        }
      }
    );
  } catch (error) {
    console.error("Error adding manual account:", error);
    alert("등록 중 오류가 발생했습니다.");
  }
}

// CSV 파일 가져오기
async function importCsvFile() {
  const fileInput = document.getElementById("csvFileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("파일을 선택해주세요.");
    return;
  }

  try {
    const text = await file.text();
    const lines = text.split("\n");

    // 헤더 확인 (첫 번째 줄)
    const header = lines[0].toLowerCase();
    if (!header.includes("url")) {
      alert("CSV 파일에 url 컬럼이 없습니다.");
      return;
    }

    // 헤더에서 url 컬럼 인덱스 찾기
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const urlIndex = headers.indexOf("url");

    if (urlIndex === -1) {
      alert("CSV 파일에 url 컬럼을 찾을 수 없습니다.");
      return;
    }

    // 도메인 추출
    const domains = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(",");
      if (columns.length > urlIndex) {
        const url = columns[urlIndex].trim().replace(/"/g, "");
        const domain = extractDomain(url);
        if (domain) {
          domains.add(domain);
        }
      }
    }

    if (domains.size === 0) {
      alert("유효한 도메인을 찾을 수 없습니다.");
      return;
    }

    // 각 도메인을 Firestore에 추가
    let successCount = 0;
    for (const domain of domains) {
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: "EVENT_DETECTED",
              action: "SIGNUP",
              domain: domain,
            },
            (response) => {
              if (response && response.success) {
                successCount++;
                resolve();
              } else {
                reject();
              }
            }
          );
        });
      } catch (error) {
        console.error(`Failed to import ${domain}:`, error);
      }
    }

    fileInput.value = "";
    await refreshData();
    alert(`${successCount}개의 계정이 가져와졌습니다.`);
  } catch (error) {
    console.error("Error importing CSV:", error);
    alert("CSV 가져오기 중 오류가 발생했습니다.");
  }
}

// 비밀번호 변경 주기 저장
async function savePeriod() {
  const period = parseInt(document.getElementById("periodInput").value);

  if (isNaN(period) || period < 1 || period > 365) {
    alert("1~365 사이의 값을 입력해주세요.");
    return;
  }

  try {
    await chrome.storage.sync.set({ passwordChangePeriod: period });

    // 모든 계정의 경고 상태 즉시 업데이트
    chrome.runtime.sendMessage(
      { type: "UPDATE_ALL_WARNING_STATUS" },
      (response) => {
        if (response && response.success) {
          console.log(`Updated ${response.data.updatedCount} accounts`);
        }
      }
    );

    await refreshData();
    alert("설정이 저장되었습니다.");
  } catch (error) {
    console.error("Error saving period:", error);
    alert("저장 중 오류가 발생했습니다.");
  }
}

// 검색 기능
function searchAccounts() {
  const searchTerm = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();

  if (!searchTerm) {
    renderAccountsTable(allAccounts);
    return;
  }

  const filtered = allAccounts.filter((acc) =>
    acc.domain.toLowerCase().includes(searchTerm)
  );

  renderAccountsTable(filtered);
}

// 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
  // 초기 로드
  refreshData();

  // 수동 등록
  document
    .getElementById("addManualAccountBtn")
    .addEventListener("click", addManualAccount);

  // CSV 가져오기
  document
    .getElementById("importCsvBtn")
    .addEventListener("click", importCsvFile);

  // 주기 저장
  document
    .getElementById("savePeriodBtn")
    .addEventListener("click", savePeriod);

  // 검색
  document
    .getElementById("searchInput")
    .addEventListener("input", searchAccounts);

  // 새로고침
  document.getElementById("refreshBtn").addEventListener("click", refreshData);

  // CSV 도움말 토글 (클릭 시 펼침/접힘)
  const csvHelpBtn = document.getElementById("csvHelpBtn");
  const csvHelpPanel = document.getElementById("csvHelpPanel");
  if (csvHelpBtn && csvHelpPanel) {
    csvHelpBtn.addEventListener("click", () => {
      csvHelpPanel.classList.toggle("hidden");
    });
  }

  // Chrome 비밀번호 관리자 열기
  const openPwdBtn = document.getElementById("openPasswordManagerBtn");
  if (openPwdBtn) {
    openPwdBtn.addEventListener("click", openPasswordManagerSafely);
  }

  // chrome:// 링크 복사
  const copyUrlBtn = document.getElementById("copyPasswordManagerUrlBtn");
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener("click", async () => {
      const urlInput = document.getElementById("passwordManagerUrl");
      try {
        await navigator.clipboard.writeText(urlInput.value);
        alert("링크가 복사되었습니다. 주소창에 붙여넣기 해주세요.");
      } catch (e) {
        // Clipboard가 막힌 경우 선택 상태로 두어 수동 복사를 유도
        urlInput.focus();
        urlInput.select();
        alert("복사 권한이 없어 선택만 했습니다. ⌘+C 로 복사해주세요.");
      }
    });
  }

  // 모달 이벤트
  document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
  document
    .getElementById("cancelEditBtn")
    .addEventListener("click", closeEditModal);

  // 모달 배경 클릭 시 닫기
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target.id === "editModal") {
      closeEditModal();
    }
  });
});

// 안전하게 비밀번호 관리자 열기 (chrome://는 차단될 수 있어 예외 처리)
async function openPasswordManagerSafely() {
  const candidates = [
    "chrome://password-manager/settings",
    "chrome://settings/passwords",
  ];

  for (const url of candidates) {
    try {
      await new Promise((resolve, reject) => {
        try {
          chrome.tabs.create({ url }, (tab) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(tab);
            }
          });
        } catch (err) {
          reject(err);
        }
      });
      // 하나라도 열렸으면 종료
      return;
    } catch (e) {
      // 다음 후보로 진행
    }
  }

  // 모두 실패 시 안내
  alert(
    "확장에서 chrome:// 페이지를 직접 열 수 없습니다.\n" +
      "위 안내 패널의 링크를 복사해 주소창에 붙여넣어 접속한 뒤, 내보내기를 진행해주세요."
  );
}
