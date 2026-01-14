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
      case 'image': return <FileImage size={15} className="text-accent-purple shrink-0" />;
      case 'log': return <AlertCircle size={15} className="text-red-400 shrink-0" />;
      case 'metric': return <Activity size={15} className="text-amber-400 shrink-0" />;
      case 'issue': return <MessageSquareWarning size={15} className="text-pink-400 shrink-0" />;
      default: return <FileCode size={15} className="text-blue-400 shrink-0" />;
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
    <div className="w-72 bg-cosmic-900 border-r border-white/5 flex flex-col h-full shrink-0 shadow-2xl">
      <div className="p-5 border-b border-white/5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
           Repository Context
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600 text-xs gap-3 border-2 border-dashed border-gray-800 rounded-xl m-2 bg-cosmic-950/50">
            <Upload size={24} className="opacity-50" />
            <div className="text-center px-4">
              <p className="font-medium text-gray-500">No context loaded</p>
              <p className="mt-1 opacity-60">Upload files or import from GitHub to begin analysis</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div key={file.id} className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-cosmic-800 border border-transparent hover:border-white/5 transition-all cursor-default">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getIcon(file.type)}
                  <span className="text-xs text-gray-300 truncate font-mono" title={file.name}>{file.name}</span>
                </div>
                <button 
                  onClick={() => onRemove(file.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 space-y-3 bg-cosmic-900/50">
        {showGithubInput ? (
          <form onSubmit={handleGithubSubmit} className="bg-cosmic-950 p-3 rounded-xl border border-white/10 shadow-lg">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Github URL</label>
            <input 
              type="text" 
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="owner/repo"
              className="w-full bg-cosmic-800 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3 font-mono"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowGithubInput(false)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-md transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isImporting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded-md flex items-center justify-center gap-1.5 font-medium transition-colors"
              >
                 {isImporting ? <span className="animate-spin">⟳</span> : <Check size={12} />}
                 Import Repo
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col items-center justify-center p-3 gap-2 bg-cosmic-800 hover:bg-cosmic-700 text-gray-400 hover:text-gray-200 text-xs rounded-xl cursor-pointer transition-all border border-white/5 hover:border-white/10 group">
                <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                <span className="font-medium">Files</span>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={onUpload}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-3 gap-2 bg-cosmic-800 hover:bg-cosmic-700 text-gray-400 hover:text-gray-200 text-xs rounded-xl cursor-pointer transition-all border border-white/5 hover:border-white/10 group">
                <FolderInput size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                <span className="font-medium">Folder</span>
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
              className="flex items-center justify-center w-full p-3 gap-2 bg-gradient-to-r from-gray-800 to-gray-800 hover:from-gray-700 hover:to-gray-700 text-gray-300 text-xs rounded-xl cursor-pointer transition-all border border-white/5 hover:border-white/10 font-medium group"
            >
              <Github size={16} />
              <span>Import GitHub Repo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};