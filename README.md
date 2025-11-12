# 🔐 계정 기록장 (Account Ledger)

웹사이트 계정 관리 자동화 및 비밀번호 변경 주기 알림을 통한 보안 강화 Chrome Extension

## 📋 프로젝트 개요

**계정 기록장**은 사용자의 웹 브라우징 경험에서 회원가입, 로그인, 비밀번호 변경을 자동으로 감지하여 기록하고, 주기적으로 비밀번호 변경을 알림하여 디지털 보안 습관을 개선하는 Chrome 확장 프로그램입니다.

## 🚀 빠른 시작

- **5분 안에 시작하기**: [QUICKSTART.md](QUICKSTART.md)
- **전체 테스트 가이드**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **테스트 페이지**: [test_page.html](test_page.html) 파일을 브라우저에서 열어보세요

## ✨ 주요 기능

### 1. 자동 감지 및 기록

- ✅ 회원가입 자동 감지 및 기록
- ✅ 로그인 자동 감지 및 최근 로그인 시간 업데이트
- ✅ 비밀번호 변경 자동 감지 및 기록

### 2. 비밀번호 변경 알림

- ✅ 설정 가능한 주기(기본 90일)에 따른 비밀번호 변경 알림
- ✅ 데스크톱 알림 및 팝업 경고 표시

### 3. CSV 데이터 가져오기

- ✅ Chrome 비밀번호 관리자에서 내보낸 CSV 파일 가져오기
- ✅ 대량의 계정 정보를 한 번에 등록

### 4. 수동 관리 기능

- ✅ 수동 계정 등록 (URL 입력)
- ✅ 계정 정보 수정 (날짜/시간 직접 입력)
- ✅ 계정 삭제
- ✅ 로그인/비밀번호 변경 시간 즉시 업데이트

## 🚀 설치 및 설정 방법

### 1단계: Firebase 프로젝트 생성

이 확장 프로그램은 **Firebase Firestore**를 사용하여 데이터를 저장합니다. 아래 단계를 따라 Firebase 프로젝트를 설정하세요.

#### 1.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. **"프로젝트 추가"** 버튼을 클릭합니다.
3. 프로젝트 이름을 입력합니다 (예: "account-ledger").
4. Google 애널리틱스는 선택사항입니다 (필요 없으면 비활성화).
5. **"프로젝트 만들기"**를 클릭합니다.

#### 1.2 Firestore 데이터베이스 설정

1. Firebase 프로젝트 콘솔에서 **"Firestore Database"**를 선택합니다.
2. **"데이터베이스 만들기"** 버튼을 클릭합니다.
3. **"프로덕션 모드로 시작"** 또는 **"테스트 모드로 시작"**을 선택합니다.
   - **테스트 모드 권장** (초기 개발용):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.time < timestamp.date(2025, 12, 31);
         }
       }
     }
     ```
   - **프로덕션 모드** (보안 강화):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId}/{document=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
4. 위치는 **"asia-northeast3 (Seoul)"**를 선택합니다.
5. **"사용 설정"**을 클릭합니다.

#### 1.3 Firebase 웹 앱 추가

1. Firebase 프로젝트 콘솔에서 **톱니바퀴 아이콘 > 프로젝트 설정**으로 이동합니다.
2. 아래로 스크롤하여 **"내 앱"** 섹션에서 **웹 아이콘(</>)**을 클릭합니다.
3. 앱 닉네임을 입력합니다 (예: "Account Ledger Extension").
4. **"앱 등록"**을 클릭합니다.
5. **Firebase SDK 구성** 정보가 표시됩니다. 이 정보를 복사해둡니다:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```

#### 1.4 Authentication 설정 (익명 인증)

1. Firebase 프로젝트 콘솔에서 **"Authentication"**을 선택합니다.
2. **"시작하기"** 버튼을 클릭합니다.
3. **"Sign-in method"** 탭에서 **"익명"**을 선택합니다.
4. **"사용 설정"** 토글을 켭니다.
5. **"저장"**을 클릭합니다.

### 2단계: Firebase 설정 파일 수정

1. `src/config/firebase-config.js` 파일을 엽니다.
2. Firebase Console에서 복사한 설정 정보로 아래 값들을 수정합니다:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // ← 여기를 수정
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // ← 여기를 수정
  projectId: "YOUR_PROJECT_ID", // ← 여기를 수정
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // ← 여기를 수정
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← 여기를 수정
  appId: "YOUR_APP_ID", // ← 여기를 수정
};
```

**⚠️ 중요**: 이 설정 파일을 수정하지 않으면 확장 프로그램이 작동하지 않습니다!

### 3단계: 아이콘 준비 (선택사항)

확장 프로그램 아이콘을 준비합니다. 아래 크기의 PNG 이미지를 `assets/icons/` 폴더에 넣어주세요:

- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

아이콘이 없으면 임시로 다음 명령어로 플레이스홀더를 생성할 수 있습니다:

```bash
# macOS에서 임시 아이콘 생성
touch assets/icons/icon16.png
touch assets/icons/icon48.png
touch assets/icons/icon128.png
```

### 4단계: Chrome에 확장 프로그램 로드

1. Chrome 브라우저를 엽니다.
2. 주소창에 `chrome://extensions/`를 입력합니다.
3. 우측 상단의 **"개발자 모드"**를 활성화합니다.
4. **"압축해제된 확장 프로그램을 로드합니다"** 버튼을 클릭합니다.
5. 이 프로젝트의 루트 폴더(`manifest.json`이 있는 폴더)를 선택합니다.
6. 확장 프로그램이 로드됩니다!

## 📚 사용 방법

### 팝업 (Popup)

- Chrome 툴바에서 확장 프로그램 아이콘을 클릭합니다.
- 현재 페이지의 계정 정보를 확인할 수 있습니다.
- **로그인 기록** / **비밀번호 변경** 버튼으로 즉시 업데이트 가능합니다.

### 옵션 페이지 (Options Page)

- 팝업에서 **"전체 관리 페이지 열기"** 버튼을 클릭하거나
- `chrome://extensions/`에서 확장 프로그램의 **"옵션"** 버튼을 클릭합니다.

#### 기능:

1. **수동 계정 등록**: URL을 입력하여 계정 추가
2. **CSV 가져오기**: Chrome 비밀번호 관리자에서 내보낸 CSV 파일 업로드
3. **비밀번호 변경 주기 설정**: 원하는 주기(일) 설정
4. **계정 목록 관리**:
   - 로그인/비밀번호 시간 업데이트
   - 계정 정보 수정 (날짜/시간 직접 입력)
   - 계정 삭제
   - 검색 기능

## 🔧 개발 가이드

### 프로젝트 구조

```
account_ledger/
├── manifest.json                 # 확장 프로그램 메타데이터
├── assets/
│   └── icons/                    # 아이콘 이미지
├── src/
│   ├── background/
│   │   └── background.js         # Service Worker (메시지 처리, Firestore 연동)
│   ├── content/
│   │   └── content_script.js     # 웹페이지 이벤트 감지
│   ├── popup/
│   │   ├── popup.html            # 팝업 UI
│   │   └── popup.js              # 팝업 로직
│   ├── options/
│   │   ├── options.html          # 옵션 페이지 UI
│   │   └── options.js            # 옵션 페이지 로직
│   └── config/
│       ├── firebase-config.js    # Firebase 설정 (사용자 수정 필요)
│       └── firebase-init.js      # Firebase 초기화
└── README.md
```

### 기술 스택

- **Manifest V3** (Chrome Extension)
- **Firebase Firestore** (데이터베이스)
- **Firebase Authentication** (익명 인증)
- **Tailwind CSS** (UI 스타일링)
- **Vanilla JavaScript** (ES6+ Modules)

### 디버깅

- **Background Service Worker**: `chrome://extensions/` → 확장 프로그램 카드 → "Service Worker" 클릭
- **Content Script**: 웹페이지에서 F12 → Console 탭
- **Popup**: 팝업 창에서 우클릭 → "검사"
- **Options Page**: 옵션 페이지에서 F12

## 📊 Firestore 데이터 구조

```javascript
// users/{userId}/accounts/{domain}
{
  "domain": "example.com",
  "signUpDate": "2023-10-25T10:00:00Z",
  "lastLoginDate": "2024-05-15T15:30:00Z",
  "lastPasswordChangeDate": "2024-01-01T00:00:00Z",
  "isWarning": false,
  "createdAt": "2023-10-25T10:00:00Z",
  "importedAt": "2023-10-25T10:00:00Z"  // CSV import 시에만
}
```

## 🔒 보안 고려사항

1. **Firebase 보안 규칙**: Firestore의 보안 규칙을 프로덕션 환경에서는 반드시 강화하세요.
2. **익명 인증**: 현재는 익명 인증을 사용하지만, 필요시 Google 로그인 등으로 변경 가능합니다.
3. **민감 정보**: 이 확장 프로그램은 비밀번호를 저장하지 않고, 도메인과 날짜 정보만 기록합니다.

## 🐛 문제 해결

### Firebase 연결 오류

- `firebase-config.js` 파일의 설정이 올바른지 확인하세요.
- Firebase Console에서 Firestore와 Authentication이 활성화되어 있는지 확인하세요.

### 이벤트가 감지되지 않음

- Content Script가 모든 URL에서 실행되도록 `manifest.json`의 `host_permissions`를 확인하세요.
- 일부 웹사이트는 특수한 구조를 사용하여 감지가 어려울 수 있습니다. 이 경우 수동 등록을 사용하세요.

### 알림이 표시되지 않음

- Chrome 설정에서 알림 권한이 허용되어 있는지 확인하세요.
- 옵션 페이지에서 알림 설정이 활성화되어 있는지 확인하세요.

## 🚧 향후 계획

### V2.0

- 계정 정보 백업 및 복구 기능
- 비밀번호 보안 수준 분석
- 계정 비활성화/탈퇴 완료 표시

### 추가 기능

- 다크 모드 지원
- 다국어 지원 (영어, 일본어 등)
- Chrome 동기화를 통한 다중 기기 지원

## 📄 라이선스

이 프로젝트는 오픈소스이며, 자유롭게 사용 및 수정할 수 있습니다.

## 👤 개발자

**KimYooBin1**

- GitHub: [@KimYooBin1](https://github.com/KimYooBin1)

## 📞 문의

문제가 발생하거나 제안사항이 있으시면 [GitHub Issues](https://github.com/KimYooBin1/account_ledger/issues)에 등록해주세요.

---

**⚠️ 중요 알림**
이 확장 프로그램을 사용하기 전에 반드시 Firebase 설정을 완료해야 합니다!
`src/config/firebase-config.js` 파일을 수정하지 않으면 확장 프로그램이 작동하지 않습니다.
