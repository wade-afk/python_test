# Cloudflare Pages 환경 변수 설정 가이드

## ⚠️ 중요: API 키가 "API key not configured" 오류가 발생하는 경우

이 문서는 Cloudflare Pages에서 `OPENAI_API_KEY` 환경 변수를 설정하는 정확한 방법을 안내합니다.

## 단계별 설정 방법

### 1. Cloudflare Dashboard 접속
1. https://dash.cloudflare.com 에 접속
2. 로그인 후 왼쪽 사이드바에서 **Pages** 클릭
3. 프로젝트 선택 (예: `python-test-9dc`)

### 2. 환경 변수 설정 (두 가지 방법)

#### 방법 A: Settings → Variables (권장)
1. 프로젝트 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Variables** 클릭
3. **Add variable** 버튼 클릭
4. 설정:
   - **Variable name**: `OPENAI_API_KEY` (정확히 이 이름)
   - **Value**: API 키 값 (예: `sk-proj-...`)
   - **Environment**: 
     - ✅ Production 체크
     - ✅ Preview 체크
5. **Save** 클릭

#### 방법 B: Settings → Functions → Environment variables
1. 프로젝트 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Functions** 클릭
3. **Environment variables** 섹션에서 **Add variable** 클릭
4. 방법 A와 동일하게 설정

### 3. 재배포 (필수!)
⚠️ **환경 변수를 추가한 후 반드시 재배포해야 합니다!**

1. 프로젝트 페이지에서 **Deployments** 탭 클릭
2. 가장 최신 배포의 **...** (점 3개) 메뉴 클릭
3. **Redeploy** 클릭
4. 또는 **Redeploy** 버튼이 보이면 바로 클릭

### 4. 확인 방법
1. 재배포가 완료되면 (약 1-2분 소요)
2. 웹사이트에서 코드 채점을 시도
3. 브라우저 콘솔(F12)을 열어 확인:
   - `Debug info` → `allEnvKeys`에 `OPENAI_API_KEY`가 포함되어 있는지 확인
   - 오류가 사라지고 정상 작동하는지 확인

## 문제 해결

### 문제 1: 환경 변수를 설정했는데도 작동하지 않음
- ✅ 재배포를 했는지 확인
- ✅ 변수 이름이 정확히 `OPENAI_API_KEY`인지 확인 (대소문자 구분)
- ✅ `VITE_` 접두사가 없는지 확인
- ✅ Production과 Preview 모두 선택했는지 확인

### 문제 2: 어디에 환경 변수를 설정해야 하는지 모르겠음
- **Settings → Variables**를 사용하는 것이 가장 확실합니다
- Functions 전용 환경 변수와 일반 환경 변수는 다를 수 있습니다

### 문제 3: 재배포 후에도 여전히 작동하지 않음
1. 환경 변수가 실제로 저장되었는지 확인:
   - Settings → Variables에서 `OPENAI_API_KEY`가 목록에 있는지 확인
2. 값이 올바른지 확인:
   - API 키 값이 정확히 입력되었는지 확인 (공백, 줄바꿈 등 없어야 함)
3. 브라우저 캐시 삭제:
   - Ctrl+Shift+R (또는 Cmd+Shift+R)로 강력 새로고침
4. Functions 로그 확인:
   - Cloudflare Dashboard → Pages → 프로젝트 → Functions → Logs

## 환경 변수 확인 (디버깅)

현재 코드는 자동으로 디버깅 정보를 제공합니다:
- 브라우저 콘솔에서 `Debug info` 확인
- `allEnvKeys`에 어떤 환경 변수가 있는지 확인
- `OPENAI_API_KEY`가 목록에 없으면 환경 변수가 설정되지 않은 것입니다

## 참고사항

- **로컬 개발**: `.env.local` 파일에 `VITE_OPENAI_API_KEY` 사용 (로컬에서만)
- **Cloudflare Pages**: `OPENAI_API_KEY` 사용 (Functions에서 사용)
- 두 환경에서 변수 이름이 다릅니다!

