
import React, { useState } from 'react';
import { evaluateAllProblems, detectCopyPaste } from '../services/geminiService';
import type { Problem, EvaluationResult } from '../types';

interface ResultsProps {
  problems: Problem[];
  userCodes: string[];
  evaluations: (EvaluationResult | null)[];
  onRetry: () => void;
}

const Results: React.FC<ResultsProps> = ({ problems, userCodes, evaluations, onRetry }) => {
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradedEvaluations, setGradedEvaluations] = useState<EvaluationResult[]>([]);
  const [hasGraded, setHasGraded] = useState<boolean>(false);

  const handleGradeAll = async () => {
    setIsGrading(true);
    try {
      const results = await evaluateAllProblems(problems, userCodes);
      setGradedEvaluations(results);
      setHasGraded(true);
    } catch (error) {
      console.error('Grading failed:', error);
    } finally {
      setIsGrading(false);
    }
  };

  // 채점된 결과가 있으면 그것을 사용, 없으면 기존 결과 사용
  const finalEvaluations = hasGraded ? gradedEvaluations : evaluations;
  const correctAnswers = finalEvaluations.filter(e => e?.isCorrect).length;
  const totalQuestions = problems.length;
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // 복사 붙여넣기 의심 코드 분석
  const cheatingAnalysis = userCodes.map((code, index) => ({
    problemIndex: index,
    problem: problems[index],
    code,
    detection: detectCopyPaste(code)
  }));

  const suspiciousProblems = cheatingAnalysis.filter(item => item.detection.isCopyPaste);
  const highRiskProblems = suspiciousProblems.filter(item => item.detection.confidence >= 80);

  let scoreColor = 'text-red-500';
  if (score >= 80) {
    scoreColor = 'text-green-500';
  } else if (score >= 50) {
    scoreColor = 'text-yellow-500';
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Quiz Completed!</h2>
      
      {/* 채점하기 버튼 */}
      {!hasGraded && (
        <div className="text-center my-6">
          <button
            onClick={handleGradeAll}
            disabled={isGrading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isGrading ? '채점 중...' : 'AI로 전체 채점하기'}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            모든 문제를 AI가 한 번에 평가합니다 (API 1회 호출)
          </p>
        </div>
      )}

      {/* 점수 표시 */}
      {hasGraded && (
        <div className="text-center my-6">
          <p className="text-lg text-slate-600 dark:text-slate-300">Your Score:</p>
          <p className={`text-6xl font-bold ${scoreColor}`}>{Math.round(score)}%</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            You answered {correctAnswers} out of {totalQuestions} questions correctly.
          </p>
        </div>
      )}

      {/* 복사 붙여넣기 의심 코드 경고 (눈에 띄게 표시) */}
      {suspiciousProblems.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-2xl font-bold text-red-800">🚨 복사 붙여넣기 의심 코드 발견!</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-lg text-red-700 mb-2">
              <strong>{suspiciousProblems.length}개 문제</strong>에서 외부 자료 복사가 의심됩니다.
            </p>
            {highRiskProblems.length > 0 && (
              <p className="text-red-600 font-semibold">
                ⚠️ 특히 <strong>{highRiskProblems.length}개 문제</strong>는 높은 위험도(80% 이상)입니다!
              </p>
            )}
          </div>

          {/* 의심 문제 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {suspiciousProblems.map((item) => (
              <div key={item.problemIndex} className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-red-800">
                    문제 {item.problemIndex + 1}: {item.problem.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    item.detection.confidence >= 80 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {item.detection.confidence}%
                  </span>
                </div>
                <div className="text-xs text-red-700">
                  <p className="mb-1">의심 사유:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {item.detection.reasons.slice(0, 2).map((reason, index) => (
                      <li key={index} className="truncate">{reason}</li>
                    ))}
                    {item.detection.reasons.length > 2 && (
                      <li className="text-red-600">...외 {item.detection.reasons.length - 2}개</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 상세 분석 결과 */}
          <div className="bg-white p-4 rounded-lg border border-red-300">
            <h4 className="font-semibold text-red-800 mb-3">📊 상세 분석 결과</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{suspiciousProblems.length}</div>
                <div className="text-red-700">의심 문제</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(suspiciousProblems.reduce((sum, item) => sum + item.detection.confidence, 0) / suspiciousProblems.length)}
                </div>
                <div className="text-orange-700">평균 신뢰도</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {suspiciousProblems.filter(item => item.detection.details.hasComplexStructure).length}
                </div>
                <div className="text-blue-700">복잡한 구조</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {suspiciousProblems.filter(item => item.detection.details.hasProfessionalNaming).length}
                </div>
                <div className="text-purple-700">전문적 용어</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-200 rounded-lg">
            <p className="text-red-800 font-semibold text-center">
              ⚠️ 이 결과는 부정행위 의심으로 인해 재검토가 필요할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold border-b pb-2 border-slate-300 dark:border-slate-600">
          {hasGraded ? 'AI 채점 결과' : '문제 목록'}
        </h3>
        {problems.map((problem, index) => {
          const cheatingInfo = cheatingAnalysis[index];
          const isSuspicious = cheatingInfo.detection.isCopyPaste;
          const isHighRisk = cheatingInfo.detection.confidence >= 80;
          
          return (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              isHighRisk 
                ? 'bg-red-50 border-red-400' 
                : isSuspicious 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${
                  isHighRisk 
                    ? 'text-red-800' 
                    : isSuspicious 
                      ? 'text-orange-800' 
                      : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {problem.title}
                </h4>
                {isSuspicious && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    isHighRisk 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {isHighRisk ? '🚨 높은 위험' : '⚠️ 의심'} ({cheatingInfo.detection.confidence}%)
                  </span>
                )}
              </div>
              
              <pre className={`mt-2 p-3 rounded-md font-mono text-xs overflow-x-auto ${
                isHighRisk 
                  ? 'bg-red-100 border border-red-300' 
                  : isSuspicious 
                    ? 'bg-orange-100 border border-orange-300' 
                    : 'bg-slate-900 text-white'
              }`}>
                <code>{userCodes[index] || '// No code submitted'}</code>
              </pre>
              
              {isSuspicious && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  isHighRisk 
                    ? 'bg-red-100 border border-red-300 text-red-700' 
                    : 'bg-orange-100 border border-orange-300 text-orange-700'
                }`}>
                  <strong>복사 붙여넣기 의심:</strong> {cheatingInfo.detection.reasons.slice(0, 2).join(', ')}
                  {cheatingInfo.detection.reasons.length > 2 && (
                    <span className="text-gray-600">...외 {cheatingInfo.detection.reasons.length - 2}개</span>
                  )}
                </div>
              )}
              
              {hasGraded && finalEvaluations[index] && (
                <div className={`mt-2 text-sm font-medium ${
                  finalEvaluations[index]?.isCorrect 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {finalEvaluations[index]?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  <span className="ml-4 text-slate-500 dark:text-slate-400 italic">
                    {finalEvaluations[index]?.feedback}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default Results;
