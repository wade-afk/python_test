
import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import Spinner from './Spinner';
import { runPythonCode } from '../services/geminiService';
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
  const [showInputForm, setShowInputForm] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState<string[]>([]);

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

  const handleRunCode = async () => {
    if (!userCode.trim()) {
      setCodeOutput('코드를 입력해주세요.');
      return;
    }

    // input() 함수가 있는지 확인
    const hasInputFunction = userCode.includes('input(');
    
    if (hasInputFunction && inputValues.length === 0) {
      // input() 함수가 있으면 입력값을 먼저 받기
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

      <CodeEditor value={userCode} onChange={(e) => onCodeChange(e.target.value)} />

      {showInputForm && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Input Required</h3>
          <p className="text-blue-700 dark:text-blue-300">Please provide an input for the code.</p>
          <input
            type="text"
            placeholder="Enter input (e.g., 'Hello')"
            className="mt-2 px-3 py-2 border border-blue-300 rounded-md text-sm"
            value={inputValues[0] || ''}
            onChange={(e) => setInputValues([e.target.value])}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRunCode();
              }
            }}
          />
          <button
            onClick={handleRunCode}
            className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors duration-200"
          >
            Run Code
          </button>
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
