#!/bin/bash

# 계정 기록장 확장 프로그램 테스트 헬퍼 스크립트

echo "🔐 계정 기록장 (Account Ledger) - 테스트 도구"
echo "================================================"
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 디렉토리 확인
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ 오류: 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 프로젝트 디렉토리 확인 완료${NC}"
echo ""

# 메뉴 표시
echo "테스트 옵션을 선택하세요:"
echo "1. 📂 테스트 페이지 열기 (test_page.html)"
echo "2. 🔍 Firebase 설정 확인"
echo "3. 📝 테스트용 CSV 파일 생성"
echo "4. 🌐 Chrome Extensions 페이지 열기"
echo "5. 📚 테스트 가이드 보기"
echo "6. 🚀 빠른 시작 가이드 보기"
echo "7. ❌ 종료"
echo ""
read -p "선택 (1-7): " choice

case $choice in
    1)
        echo -e "${BLUE}테스트 페이지를 엽니다...${NC}"
        if [ -f "test_page.html" ]; then
            open test_page.html || xdg-open test_page.html || start test_page.html
            echo -e "${GREEN}✅ 테스트 페이지가 열렸습니다.${NC}"
            echo ""
            echo "다음 단계:"
            echo "1. F12를 눌러 개발자 도구를 엽니다"
            echo "2. Console 탭에서 'Account Ledger' 메시지를 확인합니다"
            echo "3. 폼을 제출하여 자동 감지를 테스트합니다"
        else
            echo -e "${RED}❌ test_page.html 파일을 찾을 수 없습니다.${NC}"
        fi
        ;;
    2)
        echo -e "${BLUE}Firebase 설정을 확인합니다...${NC}"
        echo ""
        if grep -q "YOUR_API_KEY" src/config/firebase-config.js; then
            echo -e "${RED}⚠️  Firebase 설정이 완료되지 않았습니다!${NC}"
            echo ""
            echo "설정 방법:"
            echo "1. https://console.firebase.google.com/ 접속"
            echo "2. 프로젝트 생성"
            echo "3. Firestore Database 활성화 (테스트 모드)"
            echo "4. Authentication → 익명 로그인 활성화"
            echo "5. 프로젝트 설정 → 웹 앱 추가 → 설정 복사"
            echo "6. src/config/firebase-config.js 파일 수정"
            echo ""
            echo "자세한 내용: README.md 참고"
        else
            echo -e "${GREEN}✅ Firebase 설정이 완료된 것으로 보입니다.${NC}"
            echo ""
            echo "설정 파일 내용 (일부):"
            head -n 20 src/config/firebase-config.js
        fi
        ;;
    3)
        echo -e "${BLUE}테스트용 CSV 파일을 생성합니다...${NC}"
        cat > test_passwords.csv << 'EOF'
name,url,username,password,note
Google,https://accounts.google.com,test@gmail.com,********,Test Account
GitHub,https://github.com/login,testuser,********,Test Account
Twitter,https://twitter.com/login,@testuser,********,Test Account
Facebook,https://www.facebook.com,test@facebook.com,********,Test Account
LinkedIn,https://www.linkedin.com,test@linkedin.com,********,Test Account
EOF
        echo -e "${GREEN}✅ test_passwords.csv 파일이 생성되었습니다.${NC}"
        echo ""
        echo "파일 내용:"
        cat test_passwords.csv
        echo ""
        echo "사용 방법:"
        echo "1. 확장 프로그램의 옵션 페이지를 엽니다"
        echo "2. 'CSV 파일 가져오기' 섹션에서 이 파일을 선택합니다"
        echo "3. '가져오기' 버튼을 클릭합니다"
        ;;
    4)
        echo -e "${BLUE}Chrome Extensions 페이지를 엽니다...${NC}"
        open -a "Google Chrome" "chrome://extensions/" || \
        google-chrome "chrome://extensions/" || \
        start chrome "chrome://extensions/"
        echo -e "${GREEN}✅ Chrome Extensions 페이지가 열렸습니다.${NC}"
        echo ""
        echo "다음 단계:"
        echo "1. 우측 상단의 '개발자 모드'를 켭니다"
        echo "2. '압축해제된 확장 프로그램을 로드합니다' 클릭"
        echo "3. 이 프로젝트 폴더를 선택합니다"
        echo "   경로: $(pwd)"
        ;;
    5)
        echo -e "${BLUE}테스트 가이드를 표시합니다...${NC}"
        echo ""
        if [ -f "TESTING_GUIDE.md" ]; then
            if command -v bat &> /dev/null; then
                bat TESTING_GUIDE.md
            elif command -v less &> /dev/null; then
                less TESTING_GUIDE.md
            else
                cat TESTING_GUIDE.md
            fi
        else
            echo -e "${RED}❌ TESTING_GUIDE.md 파일을 찾을 수 없습니다.${NC}"
        fi
        ;;
    6)
        echo -e "${BLUE}빠른 시작 가이드를 표시합니다...${NC}"
        echo ""
        if [ -f "QUICKSTART.md" ]; then
            if command -v bat &> /dev/null; then
                bat QUICKSTART.md
            elif command -v less &> /dev/null; then
                less QUICKSTART.md
            else
                cat QUICKSTART.md
            fi
        else
            echo -e "${RED}❌ QUICKSTART.md 파일을 찾을 수 없습니다.${NC}"
        fi
        ;;
    7)
        echo -e "${GREEN}종료합니다.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}유용한 링크:${NC}"
echo "• 전체 가이드: README.md"
echo "• 테스트 가이드: TESTING_GUIDE.md"
echo "• 빠른 시작: QUICKSTART.md"
echo "• Firebase Console: https://console.firebase.google.com/"
echo "• Chrome Extensions: chrome://extensions/"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
