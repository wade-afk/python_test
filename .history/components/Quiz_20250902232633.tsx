
import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import Spinner from './Spinner';
import { runPythonCode, detectCheating } from '../services/geminiService';
import type { Problem, EvaluationResult } from '../types';

interface QuizProps {
  problem: Problem;
  problemNumber: number;
  totalProblems: number;
  userCode: string;
  evaluation: EvaluationResult | null;
  isLoading: boolean;
  error: string | null;
  onCodeChange: (code: string) => void;
  onRunCode: () => void;
  onNextProblem: () => void;
}

const EvaluationFeedback: React.FC<{ evaluation: EvaluationResult }> = ({ evaluation }) => {
  return (
    <div className={`p-4 rounded-lg border-l-4 ${
      evaluation.isCorrect 
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
    }`}>
      <h3 className={`text-lg font-semibold mb-2 ${
        evaluation.isCorrect 
          ? 'text-green-800 dark:text-green-300' 
          : 'text-red-800 dark:text-red-300'
      }`}>
        {evaluation.isCorrect ? '✓ 정답입니다!' : '✗ 개선이 필요합니다'}
      </h3>
      <p className="text-slate-700 dark:text-slate-300">{evaluation.feedback}</p>
    </div>
  );
};

const Quiz: React.FC<QuizProps> = ({
  problem,
  problemNumber,
  totalProblems,
  userCode,
  evaluation,
  isLoading,
  error,
  onCodeChange,
  onRunCode,
  onNextProblem,
}) => {
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [pyodideStatus, setPyodideStatus] = useState<string>('');
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [showInputForm, setShowInputForm] = useState<boolean>(false);
  const [cheatingDetection, setCheatingDetection] = useState<{
    isSuspicious: boolean;
    reasons: string[];
    confidence: number;
  } | null>(null);

  // Pyodide 상태 확인
  useEffect(() => {
    const checkPyodideStatus = async () => {
      try {
        setPyodideStatus('Python 런타임 초기화 중...');
        // 간단한 테스트로 Pyodide 상태 확인
        await runPythonCode('print("Hello")');
        setPyodideStatus('Python 런타임 준비 완료!');
      } catch (error) {
        setPyodideStatus('Python 런타임 초기화 실패');
      }
    };
    
    checkPyodideStatus();
  }, []);

  // 코드 변경 시 부정행위 감지
  useEffect(() => {
    if (userCode.trim()) {
      const detection = detectCheating(userCode);
      setCheatingDetection(detection);
    } else {
      setCheatingDetection(null);
    }
  }, [userCode]);

  // input() 함수 개수 계산
  const countInputFunctions = (code: string): number => {
    const matches = code.match(/input\(/g);
    return matches ? matches.length : 0;
  };

  const handleRunCode = async () => {
    if (!userCode.trim()) {
      setCodeOutput('코드를 입력해주세요.');
      return;
    }

    // input() 함수가 있는지 확인
    const inputCount = countInputFunctions(userCode);
    
    if (inputCount > 0 && inputValues.length !== inputCount) {
      // input() 함수 개수에 맞게 입력 필드 초기화
      setInputValues(new Array(inputCount).fill(''));
      setShowInputForm(true);
      return;
    }

    setIsRunningCode(true);
    try {
      // 입력값을 runPythonCode 함수에 전달
      const result = await runPythonCode(userCode, inputValues);
      setCodeOutput(result.output);
      setShowInputForm(false);
      setInputValues([]);
    } catch (error) {
      setCodeOutput(`코드 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValues.some(val => val.trim() === '')) {
      alert('모든 입력값을 입력해주세요.');
      return;
    }
    
    // 입력값을 설정하고 코드 실행
    setShowInputForm(false);
    handleRunCode();
  };

  const updateInputValue = (index: number, value: string) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Problem {problemNumber} / {totalProblems}
        </p>
        <h2 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{problem.title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{problem.description}</p>
      </div>

      {/* Pyodide 상태 표시 */}
      {pyodideStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {pyodideStatus}
          </div>
        </div>
      )}

      {/* 부정행위 감지 경고 */}
      {cheatingDetection && cheatingDetection.isSuspicious && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-red-800">⚠️ 부정행위 의심 코드 감지</span>
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              신뢰도: {cheatingDetection.confidence}%
            </span>
          </div>
          <div className="text-sm text-red-700">
            <p className="mb-2">다음과 같은 이유로 외부 자료 복사가 의심됩니다:</p>
            <ul className="list-disc list-inside space-y-1">
              {cheatingDetection.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-600">
              본인의 힘으로 코드를 작성했는지 확인해주세요.
            </p>
          </div>
        </div>
      )}

      <CodeEditor value={userCode} onChange={(e) => onCodeChange(e.target.value)} />

      {/* input() 함수 입력 폼 */}
      {showInputForm && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-3">
            입력값 설정 ({countInputFunctions(userCode)}개 input() 함수 감지)
          </h4>
          <p className="text-sm text-yellow-700 mb-3">
            코드에 {countInputFunctions(userCode)}개의 input() 함수가 있습니다. 실행할 입력값을 설정해주세요.
          </p>
          
          <form onSubmit={handleInputSubmit} className="space-y-3">
            {inputValues.map((value, index) => (
              <div key={index} className="flex items-center space-x-2">
                <label className="text-sm font-medium text-yellow-800 min-w-[80px]">
                  입력 {index + 1}:
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateInputValue(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-yellow-300 rounded text-sm"
                  placeholder={`${index + 1}번째 입력값을 입력하세요`}
                  required
                />
              </div>
            ))}
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors duration-200"
              >
                코드 실행
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleRunCode}
          disabled={isRunningCode || pyodideStatus.includes('실패')}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isRunningCode ? <Spinner /> : 'Run Code'}
        </button>

        <button
          onClick={onNextProblem}
          className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors duration-200"
        >
          {problemNumber === totalProblems ? 'Finish Quiz' : 'Next Problem'}
        </button>
      </div>

      {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* 코드 실행 결과 표시 */}
      {codeOutput && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Output:</h3>
          <pre className="p-4 bg-slate-900 text-white rounded-lg font-mono text-sm overflow-x-auto">
            <code>{codeOutput}</code>
          </pre>
        </div>
      )}

      {/* 기존 평가 결과가 있다면 표시 (최종 채점 후) */}
      {evaluation && (
        <div className="mt-6 space-y-4">
          {evaluation.syntaxError && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-slate-700/80 rounded-r-lg" role="alert">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Syntax Error
              </h3>
              <p className="font-mono text-sm text-slate-700 dark:text-slate-300 pl-7">
                Line {evaluation.syntaxError.line}: {evaluation.syntaxError.message}
              </p>
            </div>
          )}

          <EvaluationFeedback evaluation={evaluation} />
        </div>
      )}
    </div>
  );
};

export default Quiz;
