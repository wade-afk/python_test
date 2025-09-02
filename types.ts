
export interface SyntaxError {
  line: number;
  message: string;
}

export interface Problem {
  title: string;
  description: string;
  context?: string; // For problems requiring hidden information for evaluation (e.g., a secret number).
}

export interface EvaluationResult {
  output: string;
  isCorrect: boolean;
  feedback: string;
  syntaxError: SyntaxError | null;
}