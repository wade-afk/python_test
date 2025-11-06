# Git 명령어 가이드 (PowerShell)

## ⚠️ PowerShell에서 여러 명령어 실행하기

PowerShell에서는 `&&` 연산자가 기본적으로 작동하지 않습니다. 각 명령어를 개별적으로 실행해야 합니다.

## 방법 1: 한 줄씩 실행 (권장)

PowerShell에서 각 명령어를 **한 줄씩** 실행하세요:

```powershell
git add .
git commit -m "메시지 작성"
git push origin main
```

### 예시:
```powershell
git add .
git commit -m "Update code"
git push origin main
```

## 방법 2: 세미콜론으로 구분

PowerShell에서 세미콜론(`;`)으로 구분하면 한 줄에 여러 명령어를 실행할 수 있습니다:

```powershell
git add .; git commit -m "메시지 작성"; git push origin main
```

## 방법 3: 여러 줄 입력 모드

PowerShell에서 여러 줄로 명령어를 입력할 수 있습니다:

1. 첫 번째 명령어 입력 후 **Enter** 누르기
2. PowerShell이 `>>` 프롬프트를 보여줍니다
3. 다음 명령어 입력 후 **Enter** 누르기
4. 마지막 명령어 입력 후 **Enter** 두 번 누르기

```
PS C:\testAI\interactive-python-quiz> git add .
PS C:\testAI\interactive-python-quiz> git commit -m "Update code"
PS C:\testAI\interactive-python-quiz> git push origin main
```

## 전체 배포 프로세스

### 1단계: 변경사항 확인
```powershell
git status
```

### 2단계: 변경사항 추가
```powershell
git add .
```
또는 특정 파일만 추가:
```powershell
git add 파일이름.ts
```

### 3단계: 커밋
```powershell
git commit -m "변경사항 설명"
```

**커밋 메시지 예시:**
- `git commit -m "Fix API key configuration"`
- `git commit -m "Update UI components"`
- `git commit -m "Add new feature"`

### 4단계: 푸시
```powershell
git push origin main
```

### 5단계: Cloudflare Pages 자동 배포 확인
- Git에 푸시하면 Cloudflare Pages가 자동으로 재배포를 시작합니다
- Cloudflare Dashboard → Pages → 프로젝트 → Deployments에서 확인

## 자주 발생하는 오류 해결

### 오류 1: "nothing to commit, working tree clean"
**원인**: 커밋할 변경사항이 없습니다.

**해결**: 
- 변경사항이 있는지 확인: `git status`
- 변경사항이 없다면 커밋할 필요가 없습니다

### 오류 2: "Please tell me who you are"
**원인**: Git 사용자 정보가 설정되지 않았습니다.

**해결**:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 오류 3: "fatal: not a git repository"
**원인**: Git 저장소가 아닌 디렉토리에서 실행했습니다.

**해결**: 프로젝트 루트 디렉토리(`interactive-python-quiz`)로 이동:
```powershell
cd C:\testAI\interactive-python-quiz
```

### 오류 4: "remote origin already exists"
**원인**: 원격 저장소가 이미 설정되어 있습니다.

**해결**: 이미 설정되어 있으므로 그대로 사용하면 됩니다.

## 빠른 배포 스크립트 (선택사항)

PowerShell 스크립트 파일(`deploy.ps1`)을 만들어 사용할 수 있습니다:

```powershell
# deploy.ps1
Write-Host "Adding changes..." -ForegroundColor Green
git add .

Write-Host "Enter commit message:" -ForegroundColor Yellow
$message = Read-Host

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m $message

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "Deployment triggered!" -ForegroundColor Green
```

사용법:
```powershell
.\deploy.ps1
```

## 체크리스트

배포 전 확인사항:
- [ ] 변경사항이 있는지 확인 (`git status`)
- [ ] 의미 있는 커밋 메시지 작성
- [ ] `.env.local` 파일이 커밋되지 않았는지 확인 (`.gitignore` 확인)
- [ ] 테스트 완료
- [ ] Cloudflare Pages 환경 변수 설정 확인 (필요한 경우)

## 참고

- **Git Bash**를 사용하면 `&&` 연산자를 사용할 수 있습니다:
  ```bash
  git add . && git commit -m "message" && git push origin main
  ```

- **Windows CMD**에서도 `&&` 연산자를 사용할 수 있습니다:
  ```cmd
  git add . && git commit -m "message" && git push origin main
  ```

- **PowerShell**에서는 `&&` 대신 `;` 또는 개별 실행을 사용하세요.

