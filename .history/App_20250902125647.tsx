
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
          
          {!hasValidApiKey() && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">API Key Required</span>
              </div>
              <p className="mt-1 text-sm">
                To enable code evaluation, please set your Gemini API key in the environment variables.
                Without it, you can still view problems but code evaluation will be limited.
              </p>
            </div>
          )}
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
