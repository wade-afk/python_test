
import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  // 붙여넣기 방지 함수
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+V, Cmd+V, Shift+Insert 방지
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      return;
    }
    
    // Shift+Insert 방지
    if (e.shiftKey && e.key === 'Insert') {
      e.preventDefault();
      return;
    }
  };

  // 마우스 우클릭 방지 함수
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        placeholder="Write your Python code here... (붙여넣기 비활성화)"
        className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-300 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
      {/* 붙여넣기 비활성화 안내 메시지 */}
      <div className="absolute top-2 right-2 text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">
        붙여넣기 비활성화
      </div>
    </div>
  );
};

export default CodeEditor;
