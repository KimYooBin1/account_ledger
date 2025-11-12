// Content Script - 웹페이지에서 회원가입/로그인/비밀번호 변경 감지

(function () {
  "use strict";

  console.log("Account Ledger Content Script loaded");

  // 현재 도메인 추출
  function getCurrentDomain() {
    try {
      const url = new URL(window.location.href);
      return url.hostname.replace("www.", "");
    } catch (error) {
      console.error("Error extracting domain:", error);
      return null;
    }
  }

  // 이벤트 타입 감지 (URL 기반)
  function detectEventTypeFromURL() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // 회원가입 패턴
    const signupPatterns = [
      "/signup",
      "/sign-up",
      "/register",
      "/join",
      "/회원가입",
      "/가입",
      "/create-account",
      "/new-account",
    ];

    // 로그인 패턴
    const loginPatterns = [
      "/login",
      "/log-in",
      "/signin",
      "/sign-in",
      "/로그인",
      "/auth",
      "/authenticate",
    ];

    // 비밀번호 변경 패턴
    const passwordPatterns = [
      "/password",
      "/change-password",
      "/reset-password",
      "/update-password",
      "/비밀번호",
      "/비밀번호변경",
    ];

    if (signupPatterns.some((pattern) => pathname.includes(pattern))) {
      return "SIGNUP";
    }

    if (passwordPatterns.some((pattern) => pathname.includes(pattern))) {
      return "PASS_CHANGE";
    }

    if (loginPatterns.some((pattern) => pathname.includes(pattern))) {
      return "LOGIN";
    }

    return null;
  }

  // 폼에서 이벤트 타입 추정
  function detectEventTypeFromForm(form) {
    const formAction = form.action.toLowerCase();
    const formId = (form.id || "").toLowerCase();
    const formClass = (form.className || "").toLowerCase();

    // 폼 내용 분석
    const hasPasswordField =
      form.querySelector('input[type="password"]') !== null;
    const hasEmailField =
      form.querySelector(
        'input[type="email"], input[name*="email"], input[name*="mail"]'
      ) !== null;
    const hasUsernameField =
      form.querySelector(
        'input[name*="username"], input[name*="user"], input[name*="id"]'
      ) !== null;
    const hasPasswordConfirm =
      form.querySelectorAll('input[type="password"]').length >= 2;

    // 버튼 텍스트 분석
    const buttons = form.querySelectorAll('button, input[type="submit"]');
    let buttonTexts = "";
    buttons.forEach((btn) => {
      buttonTexts += (btn.textContent || btn.value || "").toLowerCase();
    });

    // 회원가입 판단
    if (
      hasPasswordConfirm ||
      buttonTexts.includes("sign up") ||
      buttonTexts.includes("register") ||
      buttonTexts.includes("회원가입") ||
      buttonTexts.includes("가입") ||
      formAction.includes("signup") ||
      formAction.includes("register") ||
      formId.includes("signup") ||
      formClass.includes("signup")
    ) {
      return "SIGNUP";
    }

    // 비밀번호 변경 판단
    if (
      hasPasswordConfirm ||
      buttonTexts.includes("change password") ||
      buttonTexts.includes("update password") ||
      buttonTexts.includes("비밀번호 변경") ||
      formAction.includes("password") ||
      formId.includes("password") ||
      formClass.includes("password")
    ) {
      return "PASS_CHANGE";
    }

    // 로그인 판단
    if (hasPasswordField && (hasEmailField || hasUsernameField)) {
      if (
        buttonTexts.includes("login") ||
        buttonTexts.includes("sign in") ||
        buttonTexts.includes("로그인") ||
        formAction.includes("login") ||
        formId.includes("login") ||
        formClass.includes("login")
      ) {
        return "LOGIN";
      }
    }

    return null;
  }

  // Background로 이벤트 전송
  function sendEventToBackground(action, domain) {
    chrome.runtime.sendMessage(
      {
        type: "EVENT_DETECTED",
        action: action,
        domain: domain,
        timestamp: new Date().toISOString(),
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
        } else if (response && response.success) {
          console.log(`Event recorded: ${action} for ${domain}`);
        }
      }
    );
  }

  // 폼 제출 이벤트 리스너
  function attachFormListeners() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      // 비밀번호 필드가 있는 폼만 처리
      const hasPasswordField =
        form.querySelector('input[type="password"]') !== null;
      if (!hasPasswordField) {
        return;
      }

      form.addEventListener("submit", async (event) => {
        // 폼 제출은 막지 않음
        console.log("Form submitted, analyzing...");

        const domain = getCurrentDomain();
        if (!domain) {
          return;
        }

        // URL 기반 감지
        let eventType = detectEventTypeFromURL();

        // URL로 감지 못했으면 폼 분석
        if (!eventType) {
          eventType = detectEventTypeFromForm(form);
        }

        if (eventType) {
          // 약간의 지연 후 전송 (폼 제출이 성공했을 가능성을 높임)
          setTimeout(() => {
            sendEventToBackground(eventType, domain);
          }, 1000);
        }
      });
    });

    console.log(`Attached listeners to ${forms.length} forms`);
  }

  // URL 변경 감지 (SPA 대응)
  function observeURLChanges() {
    let lastUrl = window.location.href;

    // MutationObserver로 URL 변경 감지
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log("URL changed, re-attaching listeners");

        // 새 폼이 로드될 시간을 줌
        setTimeout(() => {
          attachFormListeners();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 초기화
  function init() {
    // 페이지 로드 후 폼 리스너 부착
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        attachFormListeners();
      });
    } else {
      attachFormListeners();
    }

    // URL 변경 감지 (SPA 지원)
    observeURLChanges();

    // 동적으로 추가되는 폼 감지
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // 새로운 폼이 추가되었는지 확인
          const hasNewForm = Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType === 1) {
              // ELEMENT_NODE
              return (
                node.tagName === "FORM" || node.querySelector("form") !== null
              );
            }
            return false;
          });

          if (hasNewForm) {
            setTimeout(() => {
              attachFormListeners();
            }, 500);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 실행
  init();
})();
