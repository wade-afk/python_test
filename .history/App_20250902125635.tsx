
import React, { useState, useCallback } from 'react';
import Quiz from './components/Quiz';
import Results from './components/Results';
import { PROBLEM_SETS } from './constants';
import { evaluatePythonCode, hasValidApiKey } from './services/geminiService';
import type { Problem, EvaluationResult } from './types';

const generateRandomQuiz = (): Problem[] => {
  return PROBLEM_SETS.map(problemSet => {
    if (!problemSet || problemSet.length === 0) {
      // Fallback for an empty problem set, though this shouldn't happen with the current constants.
      return { title: 'Error', description: 'No problem found for this category.' };
    }
    const randomIndex = Math.floor(Math.random() * problemSet.length);
    return problemSet[randomIndex];
  });
};

const App: React.FC = () => {
  const [quizProblems, setQuizProblems] = useState<Problem[]>(() => generateRandomQuiz());
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [userCodes, setUserCodes] = useState<string[]>(() => new Array(quizProblems.length).fill(''));
  const [evaluations, setEvaluations] = useState<(EvaluationResult | null)[]>(() => new Array(quizProblems.length).fill(null));
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = useCallback((code: string) => {
    setUserCodes(prev => {
      const newCodes = [...prev];
      newCodes[currentProblemIndex] = code;
      return newCodes;
    });
  }, [currentProblemIndex]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const problem = quizProblems[currentProblemIndex];
      const code = userCodes[currentProblemIndex];
      const result = await evaluatePythonCode(problem, code);
      setEvaluations(prev => {
        const newEvals = [...prev];
        newEvals[currentProblemIndex] = result;
        return newEvals;
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to evaluate code. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < quizProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    const newProblems = generateRandomQuiz();
    setQuizProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserCodes(new Array(newProblems.length).fill(''));
    setEvaluations(new Array(newProblems.length).fill(null));
    setQuizFinished(false);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-200">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Interactive Python Quiz</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Test your Python skills with these challenges!</p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
          {!quizFinished ? (
            <Quiz
              problem={quizProblems[currentProblemIndex]}
              problemNumber={currentProblemIndex + 1}
              totalProblems={quizProblems.length}
              userCode={userCodes[currentProblemIndex]}
              evaluation={evaluations[currentProblemIndex]}
              isLoading={isLoading}
              error={error}
              onCodeChange={handleCodeChange}
              onRunCode={handleRunCode}
              onNextProblem={handleNextProblem}
            />
          ) : (
            <Results 
              problems={quizProblems}
              userCodes={userCodes}
              evaluations={evaluations}
              onRetry={handleRetry} 
            />
          )}
        </div>
        <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Powered by React, Tailwind CSS, and Gemini API</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
