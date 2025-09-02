/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Pyodide 전역 타입 정의
declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<any>;
  }
}
