# 🧪 테스트 가이드

계정 기록장 Chrome Extension을 실제로 테스트하는 방법을 단계별로 안내합니다.

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [Chrome에 확장 프로그램 로드](#2-chrome에-확장-프로그램-로드)
3. [기능별 테스트 방법](#3-기능별-테스트-방법)
4. [디버깅 방법](#4-디버깅-방법)
5. [테스트 체크리스트](#5-테스트-체크리스트)

---

## 1. 사전 준비

### ✅ 필수 사항 확인

#### 1.1 Firebase 설정 완료 여부

`src/config/firebase-config.js` 파일이 수정되었는지 확인:

```bash
# 터미널에서 확인
cat src/config/firebase-config.js | grep "YOUR_API_KEY"
```

**결과가 있으면**: Firebase 설정이 아직 안됨 → [README.md의 Firebase 설정](README.md#1단계-firebase-프로젝트-생성) 참고  
**결과가 없으면**: 설정 완료! ✅

#### 1.2 아이콘 파일 확인 (선택사항)

```bash
ls -la assets/icons/
```

아이콘이 없어도 테스트는 가능하지만, 기본 아이콘으로 표시됩니다.

---

## 2. Chrome에 확장 프로그램 로드

### Step 1: Chrome Extensions 페이지 열기

1. Chrome 브라우저 실행
2. 주소창에 입력: `chrome://extensions/`
3. 또는 메뉴 → 도구 더보기 → 확장 프로그램

### Step 2: 개발자 모드 활성화

- 우측 상단의 **"개발자 모드"** 토글을 켭니다.

### Step 3: 확장 프로그램 로드

1. **"압축해제된 확장 프로그램을 로드합니다"** 버튼 클릭
2. 프로젝트 루트 폴더 선택:
   ```
   /Users/kim-yubin/Desktop/project/account_ledger
   ```
3. "선택" 버튼 클릭

### Step 4: 로드 확인

- 확장 프로그램 카드가 생성되어야 합니다:
  ```
  🔐 계정 기록장 (Account Ledger)
  ID: [자동 생성된 ID]
  버전: 1.0.0
  ```

### ⚠️ 에러가 발생한 경우

**일반적인 에러**:

1. **"manifest.json이 없습니다"** → 올바른 폴더를 선택했는지 확인
2. **"Firebase is not defined"** → Firebase 설정 확인
3. **"아이콘을 찾을 수 없습니다"** → 무시해도 됨 (기능에 영향 없음)

---

## 3. 기능별 테스트 방법

### 🎯 테스트 A: 팝업(Popup) 기능 테스트

#### 1) 팝업 열기

- Chrome 툴바에서 확장 프로그램 아이콘 클릭
- 또는 확장 프로그램 관리 페이지에서 "확장 프로그램 보기" 클릭

#### 2) 확인할 항목

- ✅ 팝업이 정상적으로 열리는가?
- ✅ 현재 페이지의 도메인이 표시되는가?
- ✅ "총 계정", "경고" 통계가 표시되는가?
- ✅ 버튼들이 정상적으로 보이는가?

#### 3) 디버깅

팝업에서 우클릭 → **"검사"** 클릭 → Console 탭에서 에러 확인

---

### 🎯 테스트 B: 옵션 페이지 테스트

#### 1) 옵션 페이지 열기

**방법 1**: 팝업에서 "전체 관리 페이지 열기" 버튼 클릭  
**방법 2**: `chrome://extensions/` → 확장 프로그램 카드 → "옵션" 버튼 클릭

#### 2) 수동 계정 등록 테스트

```
1. "수동 계정 등록" 섹션에서 URL 입력: https://github.com
2. "등록하기" 버튼 클릭
3. 성공 메시지 확인: "github.com이(가) 등록되었습니다."
4. 계정 목록에 github.com이 나타나는지 확인
```

#### 3) 계정 정보 업데이트 테스트

```
1. 계정 목록에서 "로그인" 버튼 클릭
2. 페이지가 새로고침되고 "마지막 로그인" 시간이 업데이트되는지 확인
3. "비밀번호" 버튼 클릭
4. "비밀번호 변경일"이 업데이트되는지 확인
```

#### 4) 계정 수정 테스트

```
1. "수정" 버튼 클릭
2. 모달이 열리는지 확인
3. 날짜/시간 필드 수정
4. "저장" 버튼 클릭
5. 변경사항이 반영되는지 확인
```

#### 5) 계정 삭제 테스트

```
1. "삭제" 버튼 클릭
2. 확인 대화상자가 나타나는지 확인
3. "확인" 클릭
4. 계정이 목록에서 사라지는지 확인
```

---

### 🎯 테스트 C: 자동 감지 기능 테스트

**중요**: 이 기능은 실제 웹사이트에서 테스트해야 합니다!

#### 1) 로그인 감지 테스트

**추천 테스트 사이트**:

- GitHub: https://github.com/login
- Twitter/X: https://twitter.com/login
- 또는 자신이 계정을 가진 아무 사이트

**테스트 절차**:

```
1. 테스트 사이트의 로그인 페이지로 이동
2. F12 → Console 탭 열기
3. Console에서 확인: "Account Ledger Content Script loaded"
4. 로그인 폼에 정보 입력 후 제출
5. Console에서 확인: "Form submitted, analyzing..."
6. 1-2초 대기
7. 팝업 또는 옵션 페이지에서 해당 도메인이 추가되었는지 확인
```

**디버깅 팁**:

```javascript
// Console에서 직접 테스트
chrome.runtime.sendMessage(
  {
    type: "EVENT_DETECTED",
    action: "LOGIN",
    domain: "test.com",
  },
  (response) => console.log(response)
);
```

#### 2) 회원가입 감지 테스트

**테스트 사이트**:

- 테스트용 회원가입 페이지 (실제 가입하지 않아도 감지 가능)
- URL에 `/signup`, `/register` 등이 포함된 페이지

**테스트 절차**:

```
1. 회원가입 페이지로 이동
2. Content Script가 URL 패턴을 감지하는지 Console 확인
3. 폼 제출 시도 (실제로 제출하지 않아도 감지됨)
4. 계정 목록에 추가되는지 확인
```

#### 3) 비밀번호 변경 감지 테스트

**테스트 사이트**:

- GitHub Settings → Password
- 또는 URL에 `/password`, `/change-password` 포함된 페이지

---

### 🎯 테스트 D: CSV 가져오기 테스트

#### 1) 테스트용 CSV 파일 생성

터미널에서 실행:

```bash
cd /Users/kim-yubin/Desktop/project/account_ledger
cat > test_passwords.csv << 'EOF'
name,url,username,password,note
Google,https://accounts.google.com,test@gmail.com,********,
GitHub,https://github.com/login,testuser,********,
Twitter,https://twitter.com/login,@testuser,********,
EOF
```

#### 2) CSV 가져오기

```
1. 옵션 페이지 열기
2. "CSV 파일 가져오기" 섹션에서 파일 선택
3. 생성한 test_passwords.csv 선택
4. "가져오기" 버튼 클릭
5. 성공 메시지 확인: "3개의 계정이 가져와졌습니다."
6. 계정 목록에 google.com, github.com, twitter.com이 나타나는지 확인
```

---

### 🎯 테스트 E: 알림(Notification) 기능 테스트

**주의**: 알림은 24시간마다 자동으로 실행되므로, 수동으로 트리거해야 합니다.

#### 1) 수동으로 알림 트리거

```
1. chrome://extensions/ 페이지 열기
2. 확장 프로그램 카드에서 "Service Worker" 클릭
3. Console 탭에서 다음 코드 실행:

chrome.alarms.create('check_password_expiry', { when: Date.now() + 1000 });

4. 1초 후 알림이 표시되는지 확인
```

#### 2) 비밀번호 만료 계정 생성 (테스트용)

```
1. 옵션 페이지에서 계정 수동 등록 (예: test.com)
2. "수정" 버튼 클릭
3. "비밀번호 변경일"을 90일 이전으로 설정 (예: 2024-08-01)
4. "저장" 클릭
5. Service Worker Console에서 알람 트리거 (위 코드 실행)
6. 데스크톱 알림이 표시되는지 확인
```

---

### 🎯 테스트 F: 비밀번호 변경 주기 설정 테스트

```
1. 옵션 페이지에서 "비밀번호 변경 주기" 값 변경 (예: 30일)
2. "저장" 버튼 클릭
3. 페이지 새로고침
4. 상단 통계 카드에 "30일"로 표시되는지 확인
5. Chrome Storage 확인 (디버깅):
   chrome.storage.sync.get(['passwordChangePeriod'], console.log);
```

---

## 4. 디버깅 방법

### 🔍 디버깅 도구 위치

#### 1) Background Service Worker

```
chrome://extensions/ → 확장 프로그램 카드 → "Service Worker" 클릭
```

**용도**:

- Firebase 연결 상태 확인
- 메시지 수신/처리 확인
- Firestore 작업 확인

**주요 로그**:

```javascript
"Firebase initialized and signed in anonymously"; // 정상
"Message received: {type: 'EVENT_DETECTED', ...}"; // 이벤트 수신
"New account registered: example.com"; // 계정 등록
```

#### 2) Content Script

```
웹페이지에서 F12 → Console 탭
```

**용도**:

- 이벤트 감지 확인
- 폼 분석 결과 확인

**주요 로그**:

```javascript
"Account Ledger Content Script loaded"; // 스크립트 로드
"Attached listeners to 3 forms"; // 폼 리스너 부착
"Form submitted, analyzing..."; // 폼 제출 감지
"Event recorded: LOGIN for example.com"; // 이벤트 전송 성공
```

#### 3) Popup

```
팝업 창에서 우클릭 → "검사"
```

#### 4) Options Page

```
옵션 페이지에서 F12
```

### 🐛 일반적인 에러와 해결 방법

#### 에러 1: "Firebase not initialized"

**원인**: Firebase 설정이 잘못됨  
**해결**:

```javascript
// Service Worker Console에서 확인
console.log(firebaseConfig); // 설정값 확인
```

#### 에러 2: "User not authenticated"

**원인**: Firebase Authentication이 활성화되지 않음  
**해결**: Firebase Console → Authentication → 익명 로그인 활성화

#### 에러 3: "Permission denied"

**원인**: Firestore 보안 규칙 문제  
**해결**: Firestore → 규칙 → 테스트 모드로 변경

#### 에러 4: 이벤트가 감지되지 않음

**원인**: Content Script가 로드되지 않음  
**해결**:

```
1. 웹페이지 새로고침
2. F12 Console에서 "Account Ledger" 검색
3. 없으면 확장 프로그램 재로드 (chrome://extensions/)
```

---

## 5. 테스트 체크리스트

### ✅ 기본 기능 체크리스트

```
[ ] Chrome에 확장 프로그램 로드 성공
[ ] Firebase 연결 성공 (Service Worker Console 확인)
[ ] 팝업이 정상적으로 열림
[ ] 옵션 페이지가 정상적으로 열림
[ ] 수동 계정 등록 성공
[ ] 계정 목록이 정상적으로 표시됨
[ ] 로그인 시간 업데이트 성공
[ ] 비밀번호 변경일 업데이트 성공
[ ] 계정 수정 기능 정상 작동
[ ] 계정 삭제 기능 정상 작동
[ ] CSV 파일 가져오기 성공
[ ] 비밀번호 변경 주기 설정 저장됨
[ ] 검색 기능 정상 작동
```

### ✅ 고급 기능 체크리스트

```
[ ] 실제 웹사이트에서 로그인 감지 성공
[ ] 회원가입 페이지에서 계정 자동 등록
[ ] 비밀번호 변경 감지 성공
[ ] 알림 기능 정상 작동
[ ] 경고 표시 (만료된 비밀번호)
[ ] 여러 탭에서 동시 작동
[ ] 페이지 새로고침 후에도 데이터 유지
[ ] 다른 기기에서 동기화 (Firebase)
```

---

## 6. 성능 테스트

### 📊 대량 데이터 테스트

#### 100개 계정 테스트

```bash
# 100개 계정 CSV 생성
cat > large_test.csv << 'EOF'
name,url,username,password,note
EOF

for i in {1..100}; do
  echo "Site$i,https://example$i.com,user$i,pass$i," >> large_test.csv
done
```

**확인 사항**:

- 로딩 속도
- 검색 반응 속도
- 스크롤 성능

---

## 7. 실제 사용 시나리오 테스트

### 시나리오 1: 새 사용자 온보딩

```
1. 확장 프로그램 설치
2. Chrome 비밀번호 CSV 가져오기
3. 자주 사용하는 사이트 로그인
4. 팝업에서 계정 확인
5. 옵션 페이지에서 변경 주기 설정
```

### 시나리오 2: 일상적인 사용

```
1. 웹사이트 로그인 (자동 감지)
2. 팝업에서 빠른 확인
3. 비밀번호 변경 후 기록
4. 주기적 알림 확인
```

### 시나리오 3: 보안 감사

```
1. 옵션 페이지에서 전체 계정 검토
2. 경고 표시된 계정 확인
3. 오래된 비밀번호 변경
4. 미사용 계정 삭제
```

---

## 🎓 추가 팁

### Tip 1: 빠른 재로드

- 코드 수정 후: `chrome://extensions/` → 새로고침 버튼 클릭
- 단축키: 확장 프로그램 카드에서 Ctrl+R (또는 Cmd+R)

### Tip 2: 데이터 초기화

```javascript
// Service Worker Console에서 실행
chrome.storage.sync.clear();
// Firestore Console에서 users 컬렉션 삭제
```

### Tip 3: 로그 필터링

```
Service Worker Console에서:
- 필터: "Account" 입력 → 관련 로그만 표시
```

### Tip 4: 네트워크 확인

```
Service Worker Console → Network 탭
- Firestore API 호출 확인
- 응답 시간 확인
```

---

## 📞 문제 발생 시

1. **Service Worker Console에서 에러 확인**
2. **Firebase Console에서 데이터 확인**
3. **Firestore 보안 규칙 확인**
4. **Chrome Storage 확인**:
   ```javascript
   chrome.storage.sync.get(null, console.log);
   ```

테스트 중 문제가 발생하면 에러 메시지와 함께 문의해주세요!

---

**🎉 모든 테스트를 통과했다면, 축하합니다! 확장 프로그램이 정상적으로 작동하고 있습니다!**
