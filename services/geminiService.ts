import type { Problem, EvaluationResult } from '../types';

// API 키는 이제 서버 사이드(Cloudflare Functions)에서만 사용되므로
// 클라이언트 코드에서 OpenAI SDK를 직접 사용하지 않습니다.

// 부정행위 의심 코드 감지 함수
export const detectCheating = (userCode: string): {
  isSuspicious: boolean;
  reasons: string[];
  confidence: number;
} => {
  const reasons: string[] = [];
  let confidence = 0;

  // 1. 코드 길이 체크 (너무 길면 의심)
  if (userCode.length > 500) {
    reasons.push("코드가 비정상적으로 길어 복사 붙여넣기 의심");
    confidence += 30;
  }

  // 2. 복잡한 코드 구조 체크 (학생 수준을 벗어나는 복잡성)
  const complexPatterns = [
    /import\s+\w+/g,           // import 문
    /class\s+\w+/g,            // 클래스 정의
    /def\s+\w+\s*\([^)]*\)/g,  // 함수 정의
    /try\s*:/g,                // try-except 구문
    /with\s+\w+/g,             // with 문
    /lambda\s+/g,              // lambda 함수
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

  let complexCount = 0;
  complexPatterns.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      complexCount += matches.length;
    }
  });

  if (complexCount > 3) {
    reasons.push(`고급 Python 기능 사용 (${complexCount}개) - 학생 수준을 벗어남`);
    confidence += Math.min(complexCount * 10, 40);
  }

  // 3. 주석 체크 (너무 상세한 주석은 의심)
  const commentLines = (userCode.match(/#.*$/gm) || []).length;
  const totalLines = userCode.split('\n').length;
  const commentRatio = commentLines / totalLines;

  if (commentRatio > 0.3 && commentLines > 2) {
    reasons.push("과도하게 상세한 주석 - 외부 자료 복사 의심");
    confidence += 25;
  }

  // 4. 변수명 체크 (너무 전문적인 변수명)
  const professionalVars = [
    'algorithm', 'implementation', 'optimization', 'complexity',
    'efficiency', 'performance', 'robust', 'scalable',
    'maintainable', 'readable', 'concise', 'elegant'
  ];

  const hasProfessionalVars = professionalVars.some(varName => 
    userCode.toLowerCase().includes(varName)
  );

  if (hasProfessionalVars) {
    reasons.push("전문적인 변수명 사용 - 외부 자료 참조 의심");
    confidence += 20;
  }

  // 5. 코드 스타일 체크 (일관성 없는 들여쓰기나 스타일)
  const inconsistentIndentation = /^( {2,}|\t+)/gm;
  const lines = userCode.split('\n');
  let indentationTypes = new Set();
  
  lines.forEach(line => {
    if (line.match(/^\s+/)) {
      if (line.startsWith(' ')) {
        indentationTypes.add('space');
      } else if (line.startsWith('\t')) {
        indentationTypes.add('tab');
      }
    }
  });

  if (indentationTypes.size > 1) {
    reasons.push("일관성 없는 들여쓰기 - 복사 붙여넣기 의심");
    confidence += 15;
  }

  // 6. 에러 처리 체크 (너무 완벽한 에러 처리)
  const errorHandlingPatterns = [
    /except\s+Exception/g,
    /except\s+\w+Error/g,
    /finally\s*:/g,
    /raise\s+\w+/g
  ];

  let errorHandlingCount = 0;
  errorHandlingPatterns.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      errorHandlingCount += matches.length;
    }
  });

  if (errorHandlingCount > 1) {
    reasons.push("과도한 에러 처리 - 외부 자료 복사 의심");
    confidence += 20;
  }

  // 7. 문자열 포맷팅 체크 (f-string 등 고급 기능)
  const advancedStringFeatures = [
    /f["']/g,                  // f-string
    /\.format\s*\(/g,          // .format() 메서드
    /%[sdif]/g,                // % 포맷팅
    /\.join\s*\(/g             // .join() 메서드
  ];

  let advancedStringCount = 0;
  advancedStringFeatures.forEach(pattern => {
    const matches = userCode.match(pattern);
    if (matches) {
      advancedStringCount += matches.length;
    }
  });

  if (advancedStringCount > 2) {
    reasons.push("고급 문자열 처리 기능 과다 사용");
    confidence += 15;
  }

  // 최종 판정
  const isSuspicious = confidence >= 50;
  
  return {
    isSuspicious,
    reasons,
    confidence: Math.min(confidence, 100)
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
                if ((window as any).loadPyodide) {
                  pyodide = await (window as any).loadPyodide({
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

// API 키 체크 함수 (더 이상 필요 없음 - 서버 사이드에서 처리)
// 하지만 호환성을 위해 유지
export const hasValidApiKey = (): boolean => {
  // Cloudflare Functions를 사용하므로 항상 true 반환
  // 실제 API 키는 서버 사이드에서만 확인됨
  return true;
};

// API 키는 이제 서버 사이드에서만 사용되므로 클라이언트 코드에서 제거됨

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

    // 무한 루프 감지를 위한 설정
    let executionCount = 0;
    const maxExecutionCount = 500; // 최대 실행 횟수 제한 (더 엄격하게)
    let isInfiniteLoop = false;
    
    // while 루프 감지를 위한 정규식
    const whileLoopRegex = /while\s+[^:]+:/g;
    const hasWhileLoop = whileLoopRegex.test(userCode);
    
    // 무한 루프 위험도 평가
    let riskLevel = 'low';
    if (hasWhileLoop) {
      riskLevel = 'high';
      console.log('⚠️ while 루프 감지됨 - 무한 루프 위험도 높음');
    }

    // 무한 루프 감지를 위한 코드 래핑
    const wrappedCode = `
import time
import sys
import threading

# 무한 루프 감지 설정
execution_count = 0
max_executions = ${maxExecutionCount}
start_time = time.time()
max_execution_time = 3  # 3초 제한
loop_detected = False

# while 루프 감지 변수
while_loop_count = 0
max_while_iterations = 50  # while 루프 최대 반복 횟수

# 원본 print 함수 저장
original_print = print

# 안전한 print 함수 (무한 루프 감지용)
def safe_print(*args, **kwargs):
    global execution_count, loop_detected
    execution_count += 1
    
    # 실행 횟수 체크
    if execution_count > max_executions:
        print("⚠️ 무한 루프 감지! 코드 실행을 중단합니다.")
        print(f"실행 횟수 제한 ({max_executions}회)을 초과했습니다.")
        loop_detected = True
        return
    
    # 실행 시간 체크
    if time.time() - start_time > max_execution_time:
        print("⚠️ 실행 시간 초과! 코드 실행을 중단합니다.")
        print(f"최대 실행 시간 ({max_execution_time}초)을 초과했습니다.")
        loop_detected = True
        return
    
    # 원본 print 함수 호출
    original_print(*args, **kwargs)

# print 함수 오버라이드
print = safe_print

# while 루프 래퍼 함수
def safe_while(condition_func, body_func):
    global while_loop_count, loop_detected
    while_loop_count = 0
    
    while condition_func() and not loop_detected:
        while_loop_count += 1
        
        # while 루프 반복 횟수 체크
        if while_loop_count > max_while_iterations:
            print("⚠️ while 루프 무한 반복 감지! 루프를 강제 종료합니다.")
            print(f"while 루프 반복 횟수 제한 ({max_while_iterations}회)을 초과했습니다.")
            loop_detected = True
            break
        
        # 실행 시간 체크
        if time.time() - start_time > max_execution_time:
            print("⚠️ while 루프 실행 시간 초과! 루프를 강제 종료합니다.")
            loop_detected = True
            break
        
        try:
            body_func()
        except Exception as e:
            print(f"while 루프 내부 오류: {e}")
            break

# 원본 코드를 안전하게 실행
try:
    # while 루프가 있는지 미리 체크
    if 'while' in '''${userCode}''':
        print("ℹ️ while 루프가 감지되었습니다. 무한 루프 방지를 위해 실행을 모니터링합니다.")
    
    # 원본 코드 실행
    ${userCode.replace(/\n/g, '\n    ')}
    
    if loop_detected:
        print("\\n🔴 코드 실행이 무한 루프로 인해 중단되었습니다.")
        print("💡 while 루프를 사용할 때는 반드시 루프를 종료하는 조건을 포함해야 합니다.")
        print("\\n📝 올바른 while 루프 예시:")
        print("   a = int(input())")
        print("   while a > 0:")
        print("       print('양수')")
        print("       a = a - 1  # 루프를 종료하는 조건")
        print("   print('음수')")
    
except Exception as e:
    print(f"실행 중 오류 발생: {e}")
finally:
    # 원본 print 함수 복원
    print = original_print
`;

    try {
      // 래핑된 코드 실행
      await pyodideInstance.runPythonAsync(wrappedCode);

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

// 전체 문제를 한 번에 평가하는 함수 (Cloudflare Functions 사용 - API 키 보안)
export const evaluateAllProblems = async (
  problems: Problem[], 
  userCodes: string[]
): Promise<EvaluationResult[]> => {
  try {
    // Cloudflare Pages Functions 엔드포인트 호출
    // API 키는 서버 사이드에서만 사용되므로 클라이언트에 노출되지 않음
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problems,
        userCodes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API evaluation error:', errorData);
      throw new Error(errorData.error || 'Failed to evaluate code');
    }

    const results: EvaluationResult[] = await response.json();
    
    // 결과 개수 확인
    if (results.length !== problems.length) {
      console.warn(`Expected ${problems.length} results, got ${results.length}`);
      return problems.map((_, index) => ({
        output: results[index]?.output || '',
        isCorrect: results[index]?.isCorrect || false,
        feedback: results[index]?.feedback || '평가 결과를 생성할 수 없습니다.',
        syntaxError: results[index]?.syntaxError || null,
      }));
    }

    return results;
  } catch (error) {
    console.error("Error evaluating all problems:", error);
    return problems.map(() => ({
      output: "API 평가 중 오류가 발생했습니다.",
      isCorrect: false,
      feedback: error instanceof Error ? error.message : "API 호출 실패",
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