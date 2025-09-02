import { GoogleGenAI, Type } from "@google/genai";
import type { Problem, EvaluationResult } from '../types';

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

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        output: {
            type: Type.STRING,
            description: "The exact output of the code as a string. If the code has a syntax error, this should be an empty string. If it needs input, simulate reasonable input and show the output."
        },
        isCorrect: {
            type: Type.BOOLEAN,
            description: "True if the code correctly solves the problem. If there is a syntax error, this must be false."
        },
        feedback: {
            type: Type.STRING,
            description: "A brief, one-sentence explanation. If there's a syntax error, provide an encouraging message pointing to the syntax error details. Otherwise, explain why the code's logic is correct or incorrect."
        },
        syntaxError: {
            type: Type.OBJECT,
            nullable: true,
            description: "An object describing the syntax error if one exists, otherwise null.",
            properties: {
                line: {
                    type: Type.INTEGER,
                    description: "The line number where the syntax error occurred."
                },
                message: {
                    type: Type.STRING,
                    description: "A detailed, Python-interpreter-style description of the syntax error."
                }
            }
        }
    },
    required: ["output", "isCorrect", "feedback", "syntaxError"]
};


export const evaluatePythonCode = async (problem: Problem, userCode: string): Promise<EvaluationResult> => {
  // API 키가 없으면 fallback 응답 반환
  if (!hasValidApiKey()) {
    return getFallbackResponse(problem, userCode);
  }

  const contextInstruction = problem.context 
    ? `\n\n**Additional Context for Evaluation (Important: Do not reveal this specific information to the student in your feedback):**\n${problem.context}`
    : '';

  const isStringFormattingProblem = problem.title.startsWith("1.");
  const specialInstructions = isStringFormattingProblem
    ? `\n\n**Special Evaluation Rule for this Problem:** When checking for correctness, please ignore minor differences in whitespace (e.g., extra spaces between words or around punctuation). Focus on whether the core content and structure of the output match the problem's requirements.`
    : '';

  const prompt = `
    You are an expert Python programming instructor and code evaluator. Your task is to analyze the provided Python code for a given problem.

    **Problem Description:**
    ${problem.description}
    ${contextInstruction}
    ${specialInstructions}

    **Student's Code:**
    \`\`\`python
    ${userCode}
    \`\`\`

    **Your evaluation process has two steps:**

    **Step 1: Syntax Check**
    First, meticulously check the student's code for any Python syntax errors.
    - If you find a syntax error:
        - Set \`isCorrect\` to \`false\`.
        - Set \`output\` to an empty string.
        - Populate the \`syntaxError\` object with the line number and a detailed, Python-interpreter-style error message.
        - The \`feedback\` should be a simple, encouraging sentence like "It looks like there's a small syntax mistake. Check the error details below."
        - Stop here and do not proceed to Step 2.
    - If the code is syntactically correct:
        - Set \`syntaxError\` to \`null\`.
        - Proceed to Step 2.

    **Step 2: Execution and Logic Evaluation**
    - Act as a Python interpreter to execute the code.
    - If the code requires user input (e.g., using \`input()\`), simulate providing a reasonable example input that fits the problem.
    - Use the 'Additional Context' if provided to determine the correct logic (e.g., for a guessing game, use the secret number from the context).
    - Capture the exact output of the execution and place it in the \`output\` field.
    - Evaluate if the code's logic correctly solves the problem described.
    - Set \`isCorrect\` to \`true\` if it's a correct solution, otherwise \`false\`.
    - Provide a brief, one-sentence \`feedback\` on the code's correctness, offering an encouraging hint if it's wrong.

    Respond ONLY with a JSON object that adheres to the provided schema. Do not add any other text, explanations, or markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    // Basic validation to ensure the result matches the expected structure
    if (typeof result.output === 'string' && 
        typeof result.isCorrect === 'boolean' && 
        typeof result.feedback === 'string' &&
        ('syntaxError' in result)) {
      return result as EvaluationResult;
    } else {
      throw new Error("Received malformed JSON data from API.");
    }
  } catch (error) {
    console.error("Error evaluating code with Gemini:", error);
    // Fallback error message
    return {
      output: "An error occurred while trying to evaluate the code.",
      isCorrect: false,
      feedback: "Could not get a valid response from the evaluation service. Please check your connection or the API key.",
      syntaxError: null,
    };
  }
};