/// <reference types="vite/client" />

// API 키는 이제 Cloudflare Functions에서만 사용되므로 클라이언트 타입 정의는 제거됨

// Pyodide 전역 타입 정의
declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<any>;
  }
}
