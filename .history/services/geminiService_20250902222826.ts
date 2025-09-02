import { GoogleGenAI, Type } from "@google/genai";
import type { Problem, EvaluationResult } from '../types';

// Vite 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

// API 키 체크 함수
export const hasValidApiKey = (): boolean => {
  // Vite에서는 import.meta.env를 사용해야 함
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // 만약 전체 문자열이 들어왔다면 API 키 부분만 추출
  if (apiKey && apiKey.startsWith('VITE_GEMINI_API_KEY=')) {
    apiKey = apiKey.replace('VITE_GEMINI_API_KEY=', '');
  }
  
  // 더 자세한 로깅
  console.log('=== API Key Status ===');
  console.log('Has API Key:', !!apiKey);
  console.log('Key Length:', apiKey?.length);
  console.log('Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
  console.log('Full Key:', apiKey);
  console.log('=====================');
  
  return apiKey && apiKey !== 'PLACEHOLDER_API_KEY' && apiKey.trim() !== '';
};

// API 키가 없을 때의 fallback 응답
const getFallbackResponse = (problem: Problem, userCode: string): EvaluationResult => {
  return {
    output: "API key is required for code evaluation. Please set your Gemini API key.",
    isCorrect: false,
    feedback: "Code evaluation is currently unavailable. Please check your API key configuration.",
    syntaxError: null,
  };
};

// API 키를 올바르게 추출하여 Gemini API 초기화
const getCleanApiKey = (): string => {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey.startsWith('VITE_GEMINI_API_KEY=')) {
    apiKey = apiKey.replace('VITE_GEMINI_API_KEY=', '');
  }
  return apiKey || '';
};

const ai = new GoogleGenAI({ apiKey: getCleanApiKey() });

// Python 코드 실행 결과만 반환하는 함수 (API 호출 없음)
export const runPythonCode = async (userCode: string): Promise<{ output: string; hasError: boolean }> => {
  try {
    // 실제 Python 실행은 불가능하므로 시뮬레이션
    // 실제 구현에서는 Python 런타임이나 다른 방법 사용 필요
    if (userCode.includes('print(') || userCode.includes('print "')) {
      return {
        output: "Hello World\n(실행 결과 시뮬레이션 - 실제 Python 런타임 필요)",
        hasError: false
      };
    }
    
    return {
      output: "코드가 실행되었습니다.\n(실제 Python 런타임 필요)",
      hasError: false
    };
  } catch (error) {
    return {
      output: `실행 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
      hasError: true
    };
  }
};

// 전체 문제를 한 번에 평가하는 함수 (API 1번 호출)
export const evaluateAllProblems = async (
  problems: Problem[], 
  userCodes: string[]
): Promise<EvaluationResult[]> => {
  if (!hasValidApiKey()) {
    return problems.map(() => getFallbackResponse(problems[0], ''));
  }

  try {
    const prompt = `
당신은 Python 프로그래밍 전문가입니다. 다음 10개의 문제에 대한 학생들의 코드를 평가해주세요.

${problems.map((problem, index) => `
**문제 ${index + 1}: ${problem.title}**
설명: ${problem.description}
학생 코드:
\`\`\`python
${userCodes[index] || '코드 없음'}
\`\`\`
`).join('\n\n')}

각 문제에 대해 다음 JSON 형식으로 응답해주세요:
[
  {
    "output": "코드 실행 결과 또는 오류 메시지",
    "isCorrect": true/false,
    "feedback": "간단한 피드백",
    "syntaxError": null 또는 {"line": 숫자, "message": "오류 메시지"}
  }
]

JSON만 응답하고 다른 텍스트는 포함하지 마세요.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonString = response.text.trim();
    const results = JSON.parse(jsonString);

    if (Array.isArray(results) && results.length === problems.length) {
      return results.map(result => ({
        output: result.output || '',
        isCorrect: result.isCorrect || false,
        feedback: result.feedback || '',
        syntaxError: result.syntaxError || null,
      }));
    } else {
      throw new Error("Invalid response format from API");
    }
  } catch (error) {
    console.error("Error evaluating all problems:", error);
    return problems.map(() => ({
      output: "API 평가 중 오류가 발생했습니다.",
      isCorrect: false,
      feedback: "API 호출 실패",
      syntaxError: null,
    }));
  }
};

// 기존 개별 평가 함수는 제거 (사용하지 않음)
export const evaluatePythonCode = async (problem: Problem, userCode: string): Promise<EvaluationResult> => {
  // 이 함수는 더 이상 사용하지 않음
  return {
    output: "개별 평가는 비활성화되었습니다. 최종 결과에서 전체 평가를 진행하세요.",
    isCorrect: false,
    feedback: "코드 실행 결과만 확인 가능합니다.",
    syntaxError: null,
  };
};