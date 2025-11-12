# ⚡ 빠른 시작 가이드

5분 안에 확장 프로그램을 실행하고 테스트하는 방법

## 🚀 1단계: Chrome에 로드 (1분)

```bash
# 터미널에서 프로젝트 폴더로 이동
cd /Users/kim-yubin/Desktop/project/account_ledger
```

1. Chrome 열기
2. 주소창에 `chrome://extensions/` 입력
3. 우측 상단 **"개발자 모드"** 켜기
4. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
5. 현재 폴더 선택

✅ **성공**: 확장 프로그램 카드가 나타남

⚠️ **실패 시**:

- Firebase 설정이 안되어 있어도 로드는 됩니다
- 단, 기능이 작동하지 않을 수 있습니다

---

## 🔥 2단계: Firebase 설정 (2분)

### 빠른 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트명 입력 (예: account-ledger)
4. 계속 클릭 (애널리틱스는 선택사항)

### Firestore 활성화

1. 좌측 메뉴 **"Firestore Database"** 클릭
2. "데이터베이스 만들기" 클릭
3. **"테스트 모드로 시작"** 선택 ⭐
4. 위치: **asia-northeast3 (Seoul)** 선택
5. "사용 설정" 클릭

### Authentication 활성화

1. 좌측 메뉴 **"Authentication"** 클릭
2. "시작하기" 클릭
3. **"익명"** 선택
4. **"사용 설정"** 토글 켬
5. "저장" 클릭

### 설정 복사

1. 프로젝트 설정 (톱니바퀴 아이콘)
2. **"내 앱"** 섹션에서 **웹 아이콘(</>)** 클릭
3. 앱 닉네임 입력
4. "앱 등록" 클릭
5. **설정 정보 복사**

### 프로젝트에 적용

**파일**: `src/config/firebase-config.js`

```javascript
export const firebaseConfig = {
  apiKey: "여기에_붙여넣기",
  authDomain: "여기에_붙여넣기",
  projectId: "여기에_붙여넣기",
  storageBucket: "여기에_붙여넣기",
  messagingSenderId: "여기에_붙여넣기",
  appId: "여기에_붙여넣기",
};
```

**저장 후**:

- `chrome://extensions/` → 새로고침 버튼 클릭

---

## 🧪 3단계: 테스트 (2분)

### 방법 1: 테스트 페이지 사용 (추천)

```bash
# 브라우저에서 열기
open test_page.html
# 또는
# 파일 더블클릭
```

**테스트 절차**:

1. F12 → Console 확인
2. 로그인 폼 제출
3. 팝업 열기 (확장 프로그램 아이콘 클릭)
4. 계정이 추가되었는지 확인

### 방법 2: 실제 웹사이트

```
1. https://github.com/login 방문
2. 로그인 (실제로 안해도 폼만 제출)
3. 팝업에서 github.com 확인
```

### 방법 3: 수동 등록

```
1. 확장 프로그램 아이콘 클릭
2. "전체 관리 페이지 열기" 클릭
3. URL 입력: https://google.com
4. "등록하기" 클릭
```

---

## ✅ 동작 확인

### 확인 1: Firebase 연결

```
chrome://extensions/ → "Service Worker" 클릭
Console에서 확인: "Firebase initialized and signed in anonymously"
```

### 확인 2: Content Script

```
아무 웹페이지 → F12 → Console
확인: "Account Ledger Content Script loaded"
```

### 확인 3: 데이터 저장

```
Firebase Console → Firestore Database
users 컬렉션이 생성되었는지 확인
```

---

## 🐛 문제 해결

### "Firebase not initialized"

→ `firebase-config.js` 파일 수정 필요

### "Permission denied"

→ Firestore 테스트 모드 확인

### "Content Script가 안보임"

→ 페이지 새로고침 (F5)

### "계정이 추가 안됨"

→ Service Worker Console 에러 확인

---

## 📚 더 자세한 정보

- 전체 테스트 가이드: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- 설치 가이드: [README.md](README.md)
- 기획서: [Untitled.pdf](Untitled.pdf)

---

## 🎉 완료!

이제 확장 프로그램을 사용할 수 있습니다!

**다음 단계**:

- 자주 사용하는 사이트 로그인
- CSV 파일 가져오기
- 비밀번호 변경 주기 설정
