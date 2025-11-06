<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Interactive Python Quiz

An interactive Python programming quiz application built with React, TypeScript, and Vite.

## Features

- Interactive Python coding challenges
- Real-time code evaluation using OpenAI API (optional)
- Syntax error detection and feedback
- Responsive design with Tailwind CSS
- Dark mode support

## Prerequisites

- Node.js (version 16 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd interactive-python-quiz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up OpenAI API key for code evaluation:
   - Create a `.env.local` file in the root directory
   - Add your OpenAI API key: `VITE_OPENAI_API_KEY=your_actual_api_key_here`
   - Without the API key, you can still view problems but code evaluation will be limited

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Deploy to Cloudflare Pages

### 보안 개선사항
API 키는 이제 **서버 사이드(Cloudflare Functions)**에서만 사용되므로 클라이언트에 노출되지 않습니다. 이는 보안상 매우 중요합니다!

### 배포 단계

1. **Build the project**: `npm run build:cloudflare`
2. **Connect your GitHub repository** to Cloudflare Pages
3. **Build settings**:
   - Build command: `npm run build:cloudflare`
   - Build output directory: `dist`
   - Root directory: `/` (leave empty)
4. **Environment variables 설정** (중요!):
   - Go to Cloudflare Pages → Your Project → Settings → **Environment variables** 또는 **Secrets**
   - **변수 이름**: `OPENAI_API_KEY` (⚠️ `VITE_` 접두사 없이!)
   - **변수 값**: Your OpenAI API key (API 키 값만 입력)
   - **Environment**: `Production`과 `Preview` 모두 체크
   - ⚠️ **중요**: 이것은 **Secrets**로 설정하는 것을 권장합니다 (API 키는 민감 정보이므로)
5. **Functions 설정 확인**:
   - `functions/api/evaluate.ts` 파일이 루트에 있는지 확인
   - Cloudflare Pages는 자동으로 Functions 디렉토리를 인식합니다
6. **Deploy**: Git에 푸시하면 자동 배포됨

### Troubleshooting Cloudflare Deployment

만약 API 키가 여전히 작동하지 않는다면:
1. **Environment variables**에서 `OPENAI_API_KEY`가 정확히 설정되었는지 확인 (⚠️ `VITE_` 접두사 없이!)
2. **변수 값**에 API 키만 입력되어 있는지 확인
3. **Production과 Preview 환경 모두** 설정했는지 확인
4. **Functions 디렉토리**가 올바르게 배포되었는지 확인 (`functions/api/evaluate.ts`)
5. **Build logs**에서 오류가 있는지 확인
6. **Redeploy** 버튼을 클릭하여 재배포 (환경 변수 변경 후 반드시 재배포 필요!)

## How it Works

- **With API Key**: Full functionality including AI-powered code evaluation
- **Without API Key**: View problems and write code, but evaluation will show a message about API key requirement

## Technologies Used

- React 19
- TypeScript
- Vite
- Tailwind CSS
- OpenAI API (optional)
