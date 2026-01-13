import React, { useState } from 'react';
import { FileContext } from '../types';
import { FileCode, FileImage, Trash2, Upload, AlertCircle, Activity, MessageSquareWarning, Github, X, Check, FolderInput } from 'lucide-react';

interface FileTreeProps {
  files: FileContext[];
  onRemove: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGithubImport: (url: string) => Promise<void>;
  isImporting?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onRemove, onUpload, onGithubImport, isImporting }) => {
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const getIcon = (type: FileContext['type']) => {
    switch (type) {
      case 'image': return <FileImage size={16} className="text-purple-400 shrink-0" />;
      case 'log': return <AlertCircle size={16} className="text-red-400 shrink-0" />;
      case 'metric': return <Activity size={16} className="text-amber-400 shrink-0" />;
      case 'issue': return <MessageSquareWarning size={16} className="text-pink-400 shrink-0" />;
      default: return <FileCode size={16} className="text-blue-400 shrink-0" />;
    }
  };

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    await onGithubImport(githubUrl);
    setShowGithubInput(false);
    setGithubUrl('');
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
           Workspace Context
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-xs">
            <p>No files loaded.</p>
            <p className="mt-2">Upload code, logs, metrics (JSON), or diagrams.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div key={file.id} className="group flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors cursor-default">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getIcon(file.type)}
                  <span className="text-sm text-gray-300 truncate" title={file.name}>{file.name}</span>
                </div>
                <button 
                  onClick={() => onRemove(file.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        {showGithubInput ? (
          <form onSubmit={handleGithubSubmit} className="bg-gray-800 p-2 rounded border border-gray-700">
            <input 
              type="text" 
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="user/repo"
              className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={isImporting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded flex items-center justify-center gap-1"
              >
                 {isImporting ? <span className="animate-spin">⟳</span> : <Check size={12} />}
                 Import
              </button>
              <button 
                type="button"
                onClick={() => setShowGithubInput(false)}
                className="px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded"
              >
                <X size={12} />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center p-2 gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer transition-colors border border-gray-700 hover:border-gray-600">
                <Upload size={16} />
                <span>Files</span>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={onUpload}
                />
              </label>
              <label className="flex-1 flex items-center justify-center p-2 gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer transition-colors border border-gray-700 hover:border-gray-600">
                <FolderInput size={16} />
                <span>Folder</span>
                <input 
                  type="file" 
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  // @ts-ignore
                  directory=""
                  className="hidden" 
                  onChange={onUpload}
                />
              </label>
            </div>
            <button 
              onClick={() => setShowGithubInput(true)}
              className="flex items-center justify-center w-full p-2 gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer transition-colors border border-gray-700 hover:border-gray-600"
            >
              <Github size={16} />
              <span>GitHub Repo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};