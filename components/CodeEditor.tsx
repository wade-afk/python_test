
import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Write your Python code here..."
        className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-300 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default CodeEditor;
