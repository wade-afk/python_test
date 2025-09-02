
import React from 'react';
import CodeEditor from './CodeEditor';
import Spinner from './Spinner';
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
  const isCorrect = evaluation.isCorrect;
  const borderColor = isCorrect ? 'border-green-500' : 'border-red-500';
  const textColor = isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const icon = isCorrect ? '✓' : '✗';

  return (
    <div className={`p-4 border-l-4 ${borderColor} bg-slate-50 dark:bg-slate-700/80 rounded-r-lg`}>
      <h3 className={`text-lg font-semibold ${textColor} mb-2 flex items-center`}>
        <span className="mr-2">{icon}</span>
        {isCorrect ? 'Correct!' : 'Needs Improvement'}
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
  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Problem {problemNumber} / {totalProblems}
        </p>
        <h2 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{problem.title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{problem.description}</p>
      </div>

      <CodeEditor value={userCode} onChange={(e) => onCodeChange(e.target.value)} />

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onRunCode}
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? <Spinner /> : 'Run Code'}
        </button>

        {evaluation && (
          <button
            onClick={onNextProblem}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors duration-200"
          >
            {problemNumber === totalProblems ? 'Finish Quiz' : 'Next Problem'}
          </button>
        )}
      </div>

      {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

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

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200" id="output-heading">Output:</h3>
            <pre className="mt-2 p-4 bg-slate-900 text-white rounded-lg font-mono text-sm overflow-x-auto" aria-labelledby="output-heading">
              <code>{evaluation.output || (evaluation.syntaxError ? '[Execution halted due to syntax error]' : '[No output]')}</code>
            </pre>
          </div>

          <EvaluationFeedback evaluation={evaluation} />
        </div>
      )}
    </div>
  );
};

export default Quiz;
