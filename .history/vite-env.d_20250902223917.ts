/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Pyodide 모듈 타입 정의
declare module 'pyodide' {
  export function loadPyodide(options: { indexURL: string }): Promise<any>;
}
