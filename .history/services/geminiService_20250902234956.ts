import { GoogleGenAI } from "@google/genai";
import type { Problem, EvaluationResult } from '../types';

// Vite 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

// 복사 붙여넣기 전용 감지 함수 (더 정확한 감지)
export const detectCopyPaste = (userCode: string): {
  isCopyPaste: boolean;
  reasons: string[];
  confidence: number;
  details: {
    lineCount: number;
    charCount: number;
    hasComplexStructure: boolean;
    hasProfessionalNaming: boolean;
    hasExcessiveComments: boolean;
    hasAdvancedFeatures: boolean;
    hasInconsistentStyle: boolean;
  };
} => {
  const reasons: string[] = [];
  let confidence = 0;
  
  const lines = userCode.split('\n').filter(line => line.trim() !== '');
  const lineCount = lines.length;
  const charCount = userCode.length;
  
  const details = {
    lineCount,
    charCount,
    hasComplexStructure: false,
    hasProfessionalNaming: false,
    hasExcessiveComments: false,
    hasAdvancedFeatures: false,
    hasInconsistentStyle: false
  };

  // 1. 코드 길이 및 복잡성 체크
  if (charCount > 300) {
    reasons.push(`코드가 너무 길어 복사 붙여넣기 의심 (${charCount}자)`);
    confidence += 25;
  }
  
  if (lineCount > 15) {
    reasons.push(`코드 라인이 너무 많아 복사 붙여넣기 의심 (${lineCount}줄)`);
    confidence += 20;
  }

  // 2. 복잡한 구조 체크
  const complexPatterns = [
    /class\s+\w+/g,            // 클래스 정의
    /def\s+\w+\s*\([^)]*\)/g,  // 함수 정의
    /try\s*:/g,                // try-except 구문
    /with\s+\w+/g,             // with 문
    /lambda\s+/g,              // lambda 함수
    /decorator\s*@/g,          // 데코레이터
    /async\s+def/g,            // 비동기 함수
    /yield\s+/g,               // yield 문
    /generator\s+/g,           // 제너레이터
  ];

  let complexCount = 0;
  complexPatterns.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      complexCount += matches.length;
    }
  });

  if (complexCount > 2) {
    reasons.push(`고급 Python 구조 사용 (${complexCount}개) - 복사 붙여넣기 의심`);
    confidence += Math.min(complexCount * 15, 40);
    details.hasComplexStructure = true;
  }

  // 3. 전문적인 변수명 및 함수명 체크
  const professionalTerms = [
    'algorithm', 'implementation', 'optimization', 'complexity',
    'efficiency', 'performance', 'robust', 'scalable',
    'maintainable', 'readable', 'concise', 'elegant',
    'polymorphism', 'inheritance', 'encapsulation', 'abstraction',
    'recursion', 'iteration', 'traversal', 'sorting',
    'searching', 'hashing', 'caching', 'validation'
  ];

  const foundProfessionalTerms = professionalTerms.filter(term => 
    userCode.toLowerCase().includes(term)
  );

  if (foundProfessionalTerms.length > 2) {
    reasons.push(`전문적인 용어 사용: ${foundProfessionalTerms.join(', ')}`);
    confidence += Math.min(foundProfessionalTerms.length * 10, 30);
    details.hasProfessionalNaming = true;
  }

  // 4. 과도한 주석 체크
  const commentLines = (userCode.match(/#.*$/gm) || []).length;
  const commentRatio = commentLines / lineCount;

  if (commentRatio > 0.25 && commentLines > 3) {
    reasons.push(`과도한 주석 (${commentLines}줄, ${Math.round(commentRatio * 100)}%)`);
    confidence += 25;
    details.hasExcessiveComments = true;
  }

  // 5. 고급 기능 과다 사용 체크
  const advancedFeatures = [
    /f["']/g,                  // f-string
    /\.format\s*\(/g,          // .format() 메서드
    /%[sdif]/g,                // % 포맷팅
    /\.join\s*\(/g,            // .join() 메서드
    /list\s*\(/g,              // list() 함수
    /dict\s*\(/g,              // dict() 함수
    /set\s*\(/g,               // set() 함수
    /enumerate\s*\(/g,         // enumerate 함수
    /zip\s*\(/g,               // zip 함수
    /map\s*\(/g,               // map 함수
    /filter\s*\(/g,            // filter 함수
    /sorted\s*\(/g,            // sorted 함수
    /reversed\s*\(/g,          // reversed 함수
    /any\s*\(/g,               // any 함수
    /all\s*\(/g,               // all 함수
    /sum\s*\(/g,               // sum 함수
    /max\s*\(/g,               // max 함수
    /min\s*\(/g,               // min 함수
  ];

  let advancedFeatureCount = 0;
  advancedFeatures.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      advancedFeatureCount += matches.length;
    }
  });

  if (advancedFeatureCount > 4) {
    reasons.push(`고급 Python 기능 과다 사용 (${advancedFeatureCount}개)`);
    confidence += Math.min(advancedFeatureCount * 8, 35);
    details.hasAdvancedFeatures = true;
  }

  // 6. 코드 스타일 일관성 체크
  let spaceIndentCount = 0;
  let tabIndentCount = 0;

  lines.forEach(line => {
    if (line.match(/^\s+/)) {
      if (line.startsWith(' ')) {
        spaceIndentCount++;
      } else if (line.startsWith('\t')) {
        tabIndentCount++;
      }
    }
  });

  if (spaceIndentCount > 0 && tabIndentCount > 0) {
    reasons.push("스페이스와 탭 혼용 - 복사 붙여넣기 의심");
    confidence += 20;
    details.hasInconsistentStyle = true;
  }

  // 7. 에러 처리 완벽성 체크
  const errorHandlingPatterns = [
    /except\s+Exception/g,
    /except\s+\w+Error/g,
    /finally\s*:/g,
    /raise\s+\w+/g,
    /logging\s*\./g,
    /traceback\s*\./g
  ];

  let errorHandlingCount = 0;
  errorHandlingPatterns.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      errorHandlingCount += matches.length;
    }
  });

  if (errorHandlingCount > 2) {
    reasons.push(`완벽한 에러 처리 (${errorHandlingCount}개) - 외부 자료 복사 의심`);
    confidence += Math.min(errorHandlingCount * 12, 30);
  }

  // 8. 특정 패턴 체크 (웹에서 자주 복사되는 코드)
  const webCopyPatterns = [
    /def\s+main\s*\(\)/g,      // main 함수
    /if\s+__name__\s*==\s*['"]__main__['"]/g,  // main guard
    /#!/usr/bin/env python/g,   // shebang
    /#\s*-\*-\s*coding:\s*utf-8\s*-\*-/g,  // encoding declaration
    /#\s*Author:/g,            // author comment
    /#\s*Created:/g,           // created date comment
    /#\s*Modified:/g,          // modified date comment
  ];

  let webCopyCount = 0;
  webCopyPatterns.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      webCopyCount += matches.length;
    }
  });

  if (webCopyCount > 1) {
    reasons.push(`웹에서 자주 복사되는 코드 패턴 (${webCopyCount}개)`);
    confidence += webCopyCount * 15;
  }

  // 최종 판정 (복사 붙여넣기는 더 엄격하게)
  const isCopyPaste = confidence >= 60;
  
  return {
    isCopyPaste,
    reasons,
    confidence: Math.min(confidence, 100),
    details
  };
};

// 부정행위 의심 코드 감지 함수 (기존 호환성 유지)
export const detectCheating = (userCode: string): {
  isSuspicious: boolean;
  reasons: string[];
  confidence: number;
} => {
  const copyPasteResult = detectCopyPaste(userCode);
  return {
    isSuspicious: copyPasteResult.isCopyPaste,
    reasons: copyPasteResult.reasons,
    confidence: copyPasteResult.confidence
  };
};

// Pyodide 초기화 상태
let pyodide: any = null;
let isPyodideLoading = false;

// Pyodide 초기화 함수 (CDN에서 직접 로드)
const initializePyodide = async (): Promise<any> => {
  if (pyodide) return pyodide;
  if (isPyodideLoading) {
    // 이미 로딩 중이면 기다림
    while (isPyodideLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pyodide;
  }

  try {
    isPyodideLoading = true;
    console.log('Pyodide 로딩 중...');
    
    // CDN에서 Pyodide 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    script.async = true;
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    // @ts-ignore - Pyodide가 전역에 로드됨
    if (window.loadPyodide) {
      pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
      });
      console.log('Pyodide 로딩 완료!');
      return pyodide;
    } else {
      throw new Error('Pyodide 로드 실패');
    }
  } catch (error) {
    console.error('Pyodide 로딩 실패:', error);
    throw error;
  } finally {
    isPyodideLoading = false;
  }
};

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

// Python 코드 실행 결과만 반환하는 함수 (Pyodide 사용)
export const runPythonCode = async (userCode: string, userInputs: string[] = []): Promise<{ output: string; hasError: boolean }> => {
  try {
    // Pyodide 초기화
    const pyodideInstance = await initializePyodide();
    
    if (!pyodideInstance) {
      return {
        output: "Python 런타임을 초기화할 수 없습니다.",
        hasError: true
      };
    }

    // Python 코드 실행
    console.log('Python 코드 실행 중:', userCode);
    console.log('사용자 입력값:', userInputs);

    // stdout을 캡처하기 위한 설정
    let output = '';
    const originalStdout = pyodideInstance.globals.get('print');
    const originalInput = pyodideInstance.globals.get('input');

    // print 함수를 오버라이드하여 출력을 캡처
    pyodideInstance.globals.set('print', (...args: any[]) => {
      const message = args.map(arg => String(arg)).join(' ');
      output += message + '\n';
      console.log('Python 출력:', message);
    });

    // input 함수를 오버라이드하여 사용자 입력값 제공
    let inputCounter = 0;
    pyodideInstance.globals.set('input', (prompt?: string) => {
      if (prompt) {
        output += `${prompt}`;
      }
      
      let inputValue: string;
      if (inputCounter < userInputs.length) {
        // 사용자가 제공한 입력값 사용
        inputValue = userInputs[inputCounter];
        console.log(`Python input() 호출 ${inputCounter + 1}: ${prompt || ''} -> ${inputValue} (사용자 입력)`);
      } else {
        // 기본값 사용
        const defaultInputs = ["사용자", "Python", "Hello", "World", "123", "테스트", "코드", "실행", "웹", "브라우저"];
        inputValue = defaultInputs[inputCounter % defaultInputs.length];
        console.log(`Python input() 호출 ${inputCounter + 1}: ${prompt || ''} -> ${inputValue} (기본값)`);
      }
      
      inputCounter++;
      output += `${inputValue}\n`;
      
      return inputValue;
    });

    try {
      // Python 코드 실행
      await pyodideInstance.runPythonAsync(userCode);
      
      // 원래 함수들 복원
      pyodideInstance.globals.set('print', originalStdout);
      pyodideInstance.globals.set('input', originalInput);
      
      if (output.trim()) {
        return {
          output: output.trim(),
          hasError: false
        };
      } else {
        return {
          output: "코드가 실행되었습니다. (출력 없음)",
          hasError: false
        };
      }
    } catch (execError) {
      // 원래 함수들 복원
      pyodideInstance.globals.set('print', originalStdout);
      pyodideInstance.globals.set('input', originalInput);
      
      // Python 실행 오류 처리
      const errorMessage = execError instanceof Error ? execError.message : String(execError);
      
      // input() 관련 오류인 경우 더 친화적인 메시지 제공
      if (errorMessage.includes('OSError') && errorMessage.includes('I/O error')) {
        return {
          output: `입력 함수 오류: input() 함수는 웹 환경에서 제한적으로 작동합니다.\n시뮬레이션된 입력값으로 실행됩니다.`,
          hasError: true
        };
      }
      
      return {
        output: `Python 실행 오류:\n${errorMessage}`,
        hasError: true
      };
    }
  } catch (error) {
    console.error('Pyodide 실행 오류:', error);
    return {
      output: `런타임 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
