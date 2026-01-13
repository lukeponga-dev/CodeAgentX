import React, { useState } from 'react';
import { Message } from '../types';
import { Bot, User, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-indigo-600' : 'bg-emerald-600'
        }`}>
          {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`px-5 py-4 rounded-2xl w-full ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-none'
          }`}>
            {message.isThinking ? (
              <div className="flex items-center gap-3 text-emerald-400">
                <Cpu size={18} className="animate-pulse" />
                <span className="text-sm font-mono animate-pulse">Reasoning over repository...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Thinking Block */}
                {message.thoughts && (
                  <div className="mb-2">
                    <button 
                      onClick={() => setShowThinking(!showThinking)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg w-full text-left transition-colors"
                    >
                      {showThinking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Cpu size={14} className="text-purple-400" />
                      <span>Thinking Process</span>
                    </button>
                    {showThinking && (
                      <div className="mt-2 pl-4 border-l-2 border-purple-500/30 text-sm text-gray-400 font-mono bg-gray-900/30 p-3 rounded-r-lg">
                        <ReactMarkdown>{message.thoughts}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="prose prose-invert prose-sm max-w-none">
                   <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            // @ts-ignore
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={`${className} bg-gray-900 px-1 py-0.5 rounded text-indigo-300`} {...props}>
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
          <span className="text-xs text-gray-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};