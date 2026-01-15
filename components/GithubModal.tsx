import React, { useState, useEffect } from 'react';
import { Github, X, Send, Download, Shield, Layout, AlertCircle, CheckCircle2, ExternalLink, Key } from 'lucide-react';
import { fetchGithubRepo, commitToGithub, parseGithubUrl } from '../services/githubService';
import { FileContext } from '../types';

interface GithubModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFiles: FileContext[];
    onImport: (files: FileContext[], url: string) => void;
}

export const GithubModal: React.FC<GithubModalProps> = ({ isOpen, onClose, currentFiles, onImport }) => {
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [commitMessage, setCommitMessage] = useState('Update from CodeAgent X');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [successUrl, setSuccessUrl] = useState('');
    const [mode, setMode] = useState<'fetch' | 'commit'>('fetch');

    // Load token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('GITHUB_TOKEN');
        if (savedToken) setToken(savedToken);
    }, []);

    if (!isOpen) return null;

    const handleSaveToken = () => {
        localStorage.setItem('GITHUB_TOKEN', token);
        alert('Token saved locally.');
    };

    const handleFetch = async () => {
        if (!url.trim()) return;
        setStatus('loading');
        setErrorMessage('');
        try {
            const files = await fetchGithubRepo(url, token || undefined);
            onImport(files, url);
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                onClose();
            }, 1500);
        } catch (e: any) {
            setStatus('error');
            setErrorMessage(e.message || 'Failed to fetch repository.');
        }
    };

    const handleCommit = async () => {
        if (!url.trim() || !token.trim()) {
            setErrorMessage('URL and Token are required for committing.');
            return;
        }
        if (currentFiles.length === 0) {
            setErrorMessage('No files to commit.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');
        try {
            const filesToCommit = currentFiles
                .filter(f => f.type === 'file')
                .map(f => ({ path: f.name, content: f.content }));

            const commitUrl = await commitToGithub(url, token, commitMessage, filesToCommit);
            setSuccessUrl(commitUrl);
            setStatus('success');
        } catch (e: any) {
            setStatus('error');
            setErrorMessage(e.message || 'Failed to commit changes.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-obsidian-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center border border-white/10 text-white">
                            <Github size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider">GitHub Integration</h2>
                            <p className="text-[10px] text-gray-500 font-mono">Remote Repository Sync</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-black/20 mx-6 mt-4 rounded-xl border border-white/5">
                    <button
                        onClick={() => { setMode('fetch'); setStatus('idle'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'fetch' ? 'bg-white/5 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Download size={14} /> Fetch Repo
                    </button>
                    <button
                        onClick={() => { setMode('commit'); setStatus('idle'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'commit' ? 'bg-white/5 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Send size={14} /> Push Commit
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Repo URL */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Layout size={10} /> Repository URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 font-mono transition-all"
                        />
                    </div>

                    {/* PAT Token */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Shield size={10} /> GitHub Token (PAT)
                            </label>
                            <button
                                onClick={handleSaveToken}
                                className="text-[9px] text-neon-cyan hover:underline font-bold uppercase tracking-tighter"
                            >
                                Save Secret
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 font-mono transition-all pr-10"
                            />
                            <Key size={14} className="absolute right-4 top-3.5 text-gray-600" />
                        </div>
                        <p className="text-[9px] text-gray-600 leading-relaxed italic">
                            * Required for private repos or committing. Create at Settings {'->'} Developer Settings {'->'} Personal Access Tokens.
                        </p>
                    </div>

                    {mode === 'commit' && (
                        <div className="space-y-2 animate-fade-in">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Send size={10} /> Commit Message
                            </label>
                            <textarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-neon-amber/50 focus:ring-1 focus:ring-neon-amber/20 font-mono transition-all h-20 resize-none"
                            />
                        </div>
                    )}

                    {/* Status Messages */}
                    {status === 'error' && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-neon-rose/5 border border-neon-rose/20 animate-shake">
                            <AlertCircle className="text-neon-rose shrink-0" size={18} />
                            <p className="text-xs text-neon-rose/90 font-medium">{errorMessage}</p>
                        </div>
                    )}

                    {status === 'success' && mode === 'fetch' && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-emerald/5 border border-neon-emerald/20 animate-fade-in">
                            <CheckCircle2 className="text-neon-emerald" size={18} />
                            <p className="text-xs text-neon-emerald/90 font-medium">Repository data loaded successfully!</p>
                        </div>
                    )}

                    {status === 'success' && mode === 'commit' && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                                <CheckCircle2 className="text-neon-cyan" size={18} />
                                <p className="text-xs text-neon-cyan/90 font-medium">Commit pushed successfully!</p>
                            </div>
                            <a
                                href={successUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 transition-all group"
                            >
                                <span>View Commit on GitHub</span>
                                <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white/[0.01] border-t border-white/5">
                    {mode === 'fetch' ? (
                        <button
                            onClick={handleFetch}
                            disabled={status === 'loading'}
                            className="w-full py-4 bg-gradient-to-r from-neon-cyan to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-obsidian-950 font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-neon-cyan/20"
                        >
                            {status === 'loading' ? <div className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin"></div> : <Download size={18} />}
                            FETCH REPOSITORY
                        </button>
                    ) : (
                        <button
                            onClick={handleCommit}
                            disabled={status === 'loading'}
                            className="w-full py-4 bg-gradient-to-r from-neon-amber to-orange-600 hover:from-amber-400 hover:to-orange-500 text-obsidian-950 font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-neon-amber/20"
                        >
                            {status === 'loading' ? <div className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin"></div> : <Send size={18} />}
                            PUSH CHANGES
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
