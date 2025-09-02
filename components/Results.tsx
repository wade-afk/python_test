
import React from 'react';
import type { Problem, EvaluationResult } from '../types';

interface ResultsProps {
  problems: Problem[];
  userCodes: string[];
  evaluations: (EvaluationResult | null)[];
  onRetry: () => void;
}

const Results: React.FC<ResultsProps> = ({ problems, userCodes, evaluations, onRetry }) => {
  const correctAnswers = evaluations.filter(e => e?.isCorrect).length;
  const totalQuestions = problems.length;
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  let scoreColor = 'text-red-500';
  if (score >= 80) {
    scoreColor = 'text-green-500';
  } else if (score >= 50) {
    scoreColor = 'text-yellow-500';
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Quiz Completed!</h2>
      <div className="text-center my-6">
        <p className="text-lg text-slate-600 dark:text-slate-300">Your Score:</p>
        <p className={`text-6xl font-bold ${scoreColor}`}>{Math.round(score)}%</p>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          You answered {correctAnswers} out of {totalQuestions} questions correctly.
        </p>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold border-b pb-2 border-slate-300 dark:border-slate-600">Review Your Answers</h3>
        {problems.map((problem, index) => (
          <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{problem.title}</h4>
            <pre className="mt-2 p-3 bg-slate-900 text-white rounded-md font-mono text-xs overflow-x-auto">
              <code>{userCodes[index] || '// No code submitted'}</code>
            </pre>
            <div className={`mt-2 text-sm font-medium ${evaluations[index]?.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {evaluations[index]?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              <span className="ml-4 text-slate-500 dark:text-slate-400 italic">{evaluations[index]?.feedback}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default Results;
