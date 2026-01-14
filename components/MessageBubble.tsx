import React, { useState } from 'react';
import { Message } from '../types';
import { Bot, User, Cpu, ChevronDown, ChevronRight, Brain, CheckCircle2, ShieldCheck, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
  onCodeReview?: (code: string, language: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCodeReview }) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-1 ring-white/20' 
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-white/20'
        }`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`px-6 py-5 rounded-2xl w-full shadow-md ${
            isUser 
              ? 'bg-gradient-to-br from-cosmic-700 to-cosmic-800 text-white rounded-tr-none border border-white/10' 
              : 'bg-cosmic-800/80 backdrop-blur-sm border border-white/5 text-gray-200 rounded-tl-none'
          }`}>
            {message.isThinking ? (
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="relative">
                    <Cpu size={18} className="animate-pulse" />
                    <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-40 animate-pulse"></div>
                </div>
                <span className="text-sm font-mono animate-pulse">Reasoning over repository...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Thinking Block with Signature */}
                {message.thoughts && (
                  <div className="mb-2 group">
                    <button 
                      onClick={() => setShowThinking(!showThinking)}
                      className={`flex items-center gap-3 text-xs font-medium px-4 py-2.5 rounded-xl w-full text-left transition-all border ${
                          showThinking 
                            ? 'text-accent-purple bg-purple-900/10 border-purple-500/30' 
                            : 'text-gray-500 hover:text-gray-300 bg-cosmic-950/50 hover:bg-cosmic-950 border-white/5'
                      }`}
                    >
                      {showThinking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Brain size={14} className={showThinking ? "text-accent-purple" : "text-gray-600"} />
                      <span className="uppercase tracking-wide">Thinking Process</span>
                    </button>
                    
                    {showThinking && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-purple-500/20 bg-cosmic-950 shadow-inner">
                        <div className="p-5 text-sm text-gray-400 font-mono leading-relaxed border-b border-purple-500/10 bg-purple-900/5">
                          <ReactMarkdown>{message.thoughts}</ReactMarkdown>
                        </div>
                        <div className="px-4 py-2 bg-purple-950/30 flex items-center justify-between select-none backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-[10px] text-accent-purple/90 uppercase tracking-widest font-bold">
                                <CheckCircle2 size={12} />
                                <span>Verified Thought Signature</span>
                            </div>
                            <div className="text-[10px] text-purple-500/40 font-mono">
                                GEMINI-3-REASONING
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-gray-300">
                   <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                      code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeContent = String(children).replace(/\n$/, '');

                        return !inline && match ? (
                          <div className="my-5 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg">
                            {/* Code Block Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                  </div>
                                  <span className="text-xs text-gray-400 font-mono lowercase ml-2">{language}</span>
                                </div>
                                {onCodeReview && (
                                  <button 
                                    onClick={() => onCodeReview(codeContent, language)}
                                    className="flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 px-2.5 py-1 rounded-md transition-colors border border-emerald-900"
                                    title="Check for bugs and best practices"
                                  >
                                    <ShieldCheck size={12} />
                                    <span>AI Review</span>
                                  </button>
                                )}
                            </div>
                            <SyntaxHighlighter
                              // @ts-ignore
                              style={vscDarkPlus}
                              language={language}
                              PreTag="div"
                              customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '13px' }}
                              {...props}
                            >
                              {codeContent}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={`${className} bg-cosmic-950 px-1.5 py-0.5 rounded text-indigo-300 border border-white/5 font-mono text-[0.9em]`} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-600 mt-2 px-2 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};