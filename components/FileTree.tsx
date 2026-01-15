import React, { useState } from 'react';
import { FileContext } from '../types';
import { FileCode, FileImage, Trash2, Upload, AlertCircle, Activity, MessageSquareWarning, Github, X, FolderInput, File, Layers } from 'lucide-react';

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
      case 'image': return <FileImage size={14} className="text-neon-purple shrink-0" />;
      case 'log': return <AlertCircle size={14} className="text-neon-rose shrink-0" />;
      case 'metric': return <Activity size={14} className="text-neon-amber shrink-0" />;
      case 'issue': return <MessageSquareWarning size={14} className="text-pink-400 shrink-0" />;
      default: return <FileCode size={14} className="text-neon-cyan shrink-0" />;
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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2 text-gray-300">
          <Layers size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Context</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-gray-500">
          {files.length}
        </span>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center justify-center">
              <File size={20} className="text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-widest">
              No Context Loaded
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {files.map((file) => (
              <div key={file.id} className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 hover:border-white/5 border border-transparent transition-all cursor-default text-gray-400 hover:text-gray-200">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    {getIcon(file.type)}
                  </div>
                  <span className="text-xs truncate font-mono tracking-tight" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(file.id)}
                  className="text-gray-600 hover:text-neon-rose opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/5 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md">
        {showGithubInput ? (
          <form onSubmit={handleGithubSubmit} className="bg-obsidian-900/50 p-2.5 rounded-lg border border-white/10 shadow-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-neon-cyan font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Github size={10} /> GitHub Repo
              </label>
              <button type="button" onClick={() => setShowGithubInput(false)} className="text-gray-600 hover:text-white"><X size={12} /></button>
            </div>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="owner/repo"
              className="w-full bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 mb-2 font-mono"
              autoFocus
            />
            <button
              type="submit"
              disabled={isImporting}
              className="w-full bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-[10px] py-1.5 rounded-md flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide transition-colors border border-neon-cyan/20"
            >
              {isImporting ? <span className="animate-spin">⟳</span> : "Import"}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            <label className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-allQH border border-transparent hover:border-white/5 group active:scale-95">
              <Upload size={14} className="group-hover:text-neon-cyan transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wide">File</span>
              <input type="file" multiple className="hidden" onChange={onUpload} />
            </label>
            <label className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 group active:scale-95">
              <FolderInput size={14} className="group-hover:text-neon-purple transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wide">Folder</span>
              <input type="file" multiple
                // @ts-ignore
                webkitdirectory="" directory=""
                className="hidden" onChange={onUpload} />
            </label>
            <button
              onClick={() => setShowGithubInput(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 group active:scale-95"
            >
              <Github size={14} className="group-hover:text-white transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wide">Git</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};