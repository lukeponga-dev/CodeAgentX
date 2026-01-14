import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AgentMode, AgentState, FileContext, Message, ViewMode } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { generateDependencyGraph } from './services/dependencyService';
import { fetchGithubRepo } from './services/githubService';
import { FileTree } from './components/FileTree';
import { MessageBubble } from './components/MessageBubble';
import { DependencyGraph } from './components/DependencyGraph';
import { Send, Zap, BrainCircuit, Sparkles, MessageSquare, Network, Brain } from 'lucide-react';

// Storage keys for persistence
const STORAGE_KEYS = {
  MESSAGES: 'codeagent_messages',
  FILES: 'codeagent_files'
};

export default function App() {
  // Initialize messages from localStorage or default
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to restore messages from storage:', e);
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        text: "I am CodeAgent X, powered by Gemini 3. \n\nI can analyze your codebase, interpret architecture diagrams, and debug failure signals. Upload your files to the context sidebar to get started.",
        timestamp: Date.now()
      }
    ];
  });

  // Initialize files from localStorage or empty
  const [files, setFiles] = useState<FileContext[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FILES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to restore files from storage:', e);
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [agentMode, setAgentMode] = useState<AgentMode>(AgentMode.ARCHITECT);
  const [thinkingBudget, setThinkingBudget] = useState<number>(4096);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CHAT);
  const [agentState, setAgentState] = useState<AgentState>({ status: 'idle' });
  const [isImporting, setIsImporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages to local storage (likely quota exceeded):', e);
    }
  }, [messages]);

  // Persist files whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save files to local storage (likely quota exceeded):', e);
    }
  }, [files]);

  useEffect(() => {
    if (viewMode === ViewMode.CHAT) {
      scrollToBottom();
    }
  }, [messages, viewMode]);

  const handleModeChange = (mode: AgentMode) => {
    setAgentMode(mode);
    // Set default thinking budgets based on mode
    if (mode === AgentMode.ARCHITECT) {
      setThinkingBudget(4096);
    } else {
      setThinkingBudget(0);
    }
  };

  // Memoize graph data calculation to avoid reprocessing on every render
  const graphData = useMemo(() => generateDependencyGraph(files), [files]);

  // Helper to process response text and extract thoughts
  const processResponse = (fullText: string): { text: string; thoughts?: string } => {
    const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      const thoughts = thinkingMatch[1].trim();
      const text = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      return { text, thoughts };
    }
    return { text: fullText };
  };

  const triggerAutoAnalysis = async (currentFiles: FileContext[], newFileCount: number, source: 'upload' | 'github') => {
    const thinkingMsgId = 'auto-think-' + Date.now();
    
    setMessages(prev => [...prev, {
      id: thinkingMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);
    
    setAgentState({ status: 'analyzing' });

    try {
      let prompt = '';
      if (source === 'github') {
         prompt = `I have just imported a GitHub repository with ${newFileCount} source files. \n\nPlease perform an initial architectural audit of this codebase. \n1. Identify the main entry points and tech stack.\n2. Spot any potential architectural weaknesses or security concerns in the visible files.\n3. Recommend next steps for working with this repo.\n\nBe concise.`;
      } else {
         prompt = `I have just uploaded ${newFileCount} new file(s) to the workspace. \n\nPlease perform an immediate analysis of the codebase context. \n1. Summarize the architectural structure based on these new additions.\n2. Identify any potential bugs, security risks, or performance bottlenecks.\n3. Suggest the next logical step for development.\n\nKeep the response concise and actionable.`;
      }

      // Always use ARCHITECT mode for deep reasoning on new files, with current thinking budget
      const responseText = await sendMessageToGemini(
        prompt,
        AgentMode.ARCHITECT,
        currentFiles,
        [],
        null,
        Math.max(thinkingBudget, 2048) // Ensure at least some thinking for analysis
      );

      const { text, thoughts } = processResponse(responseText);

      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: text, thoughts: thoughts, isThinking: false }
          : msg
      ));
      setAgentState({ status: 'idle' });

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: "I analyzed the uploaded files but encountered an error generating the report.", isThinking: false }
          : msg
      ));
      setAgentState({ status: 'error' });
    }
  };

  const handleGithubImport = async (url: string) => {
    setIsImporting(true);
    setAgentState({ status: 'analyzing' });
    try {
      const repoFiles = await fetchGithubRepo(url);
      const updatedFiles = [...files, ...repoFiles];
      setFiles(updatedFiles);
      
      const systemMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `Successfully imported ${repoFiles.length} files from ${url}. Analyzing...`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);

      await triggerAutoAnalysis(updatedFiles, repoFiles.length, 'github');
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `GitHub Import Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setAgentState({ status: 'error' });
    } finally {
      setIsImporting(false);
      // Ensure state is idle if not analysis is triggered (error case)
      if (agentState.status === 'error') {
          setTimeout(() => setAgentState({ status: 'idle' }), 2000);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAgentState({ status: 'analyzing' }); // Show 'Reasoning...' immediately

      const newFiles: FileContext[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        
        const isImage = file.type.startsWith('image/');
        
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const content = event.target?.result as string;
            // Use base64 string for images, text for code/logs
            const finalContent = isImage ? content.split(',')[1] : content; 

            // Simple heuristic for file types
            let type: FileContext['type'] = 'file';
            const lowerName = file.name.toLowerCase();
            if (isImage) {
              type = 'image';
            } else if (lowerName.endsWith('.log')) {
              type = 'log';
            } else if (lowerName.endsWith('.json') || lowerName.endsWith('.csv')) {
              type = 'metric';
            } else if (lowerName.includes('issue') || lowerName.includes('report') || lowerName.includes('ticket')) {
              type = 'issue';
            }

            // Use webkitRelativePath for folder uploads to preserve structure
            const fileName = file.webkitRelativePath || file.name;

            newFiles.push({
              id: Math.random().toString(36).substring(7),
              name: fileName,
              content: finalContent,
              type: type,
              mimeType: file.type
            });
            resolve();
          };
          
          if (isImage) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });
      }
      
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      // Reset input to allow same file selection again if needed
      e.target.value = '';

      // Trigger the analysis
      await triggerAutoAnalysis(updatedFiles, newFiles.length, 'upload');
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAgentState({ status: 'analyzing' });

    // Add placeholder thinking message
    const thinkingMsgId = 'thinking-' + Date.now();
    setMessages(prev => [...prev, {
      id: thinkingMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      const responseText = await sendMessageToGemini(
        userMsg.text,
        agentMode,
        files,
        [], 
        null,
        thinkingBudget
      );

      const { text, thoughts } = processResponse(responseText);

      // Replace thinking message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: text, thoughts: thoughts, isThinking: false }
          : msg
      ));
      setAgentState({ status: 'idle' });

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: "I encountered a critical error processing your request.", isThinking: false }
          : msg
      ));
      setAgentState({ status: 'error' });
    }
  };

  const handleCodeReview = async (code: string, language: string) => {
    setAgentState({ status: 'analyzing' });

    const reviewPrompt = `
      Please review the following ${language} code snippet. 
      
      Focus on:
      1. Potential bugs and logic errors.
      2. Security vulnerabilities.
      3. Code style and best practice improvements.
      4. Performance optimizations.

      Provide the review in a concise structured format, followed by the corrected code block if necessary.

      Code to Review:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const thinkingMsgId = 'review-' + Date.now();
    
    // Optimistic UI: Add the request to chat history effectively
    const userMsg: Message = {
      id: 'req-' + Date.now(),
      role: 'user',
      text: `Review this ${language} code for bugs and best practices.`,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg, {
      id: thinkingMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      // Use ARCHITECT mode for reviews to get better reasoning
      const responseText = await sendMessageToGemini(
        reviewPrompt,
        AgentMode.ARCHITECT,
        files,
        [], 
        null,
        2048 // Sufficient budget for code review reasoning
      );

      const { text, thoughts } = processResponse(responseText);

      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: text, thoughts: thoughts, isThinking: false }
          : msg
      ));
      setAgentState({ status: 'idle' });

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMsgId 
          ? { ...msg, text: "Unable to complete code review at this time.", isThinking: false }
          : msg
      ));
      setAgentState({ status: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-cosmic-950 text-cosmic-100 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/5 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-emerald/5 blur-[120px]"></div>
      </div>

      {/* Sidebar: Repository Context */}
      <div className="z-10 relative h-full flex shrink-0">
          <FileTree 
            files={files} 
            onRemove={removeFile} 
            onUpload={handleFileUpload}
            onGithubImport={handleGithubImport}
            isImporting={isImporting}
          />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 glass-panel z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="font-bold text-gray-100 tracking-tight text-lg">CodeAgent X</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                <span className={`w-1.5 h-1.5 rounded-full ${agentState.status === 'analyzing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                {agentState.status === 'analyzing' ? 'Reasoning Engine Active' : 'System Online'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-cosmic-900/50 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setViewMode(ViewMode.CHAT)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === ViewMode.CHAT
                    ? 'bg-cosmic-700 text-white shadow-sm ring-1 ring-white/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <MessageSquare size={14} />
                Chat
              </button>
              <button
                onClick={() => setViewMode(ViewMode.GRAPH)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === ViewMode.GRAPH
                    ? 'bg-cosmic-700 text-white shadow-sm ring-1 ring-white/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Network size={14} />
                Graph
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-cosmic-900/50 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => handleModeChange(AgentMode.ARCHITECT)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  agentMode === AgentMode.ARCHITECT 
                    ? 'bg-cosmic-700 text-accent-emerald shadow-sm ring-1 ring-emerald-500/20' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <BrainCircuit size={14} />
                Architect
              </button>
              <button 
                onClick={() => handleModeChange(AgentMode.FAST)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  agentMode === AgentMode.FAST 
                    ? 'bg-cosmic-700 text-accent-cyan shadow-sm ring-1 ring-cyan-500/20' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Zap size={14} />
                Fast
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === ViewMode.CHAT ? (
            <main className="h-full overflow-y-auto p-6 scroll-smooth pb-0">
              <div className="max-w-4xl mx-auto pb-4">
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onCodeReview={handleCodeReview}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </main>
          ) : (
             <main className="h-full w-full">
                <DependencyGraph data={graphData} />
             </main>
          )}
        </div>

        {/* Input Area */}
        {viewMode === ViewMode.CHAT && (
          <div className="p-6 pt-2 shrink-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950 to-transparent">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-cosmic-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={files.length > 0 ? "Ask about the loaded context..." : "Describe a task or upload files for analysis..."}
                  className="w-full bg-transparent border-none text-gray-200 p-5 focus:ring-0 resize-none min-h-[70px] max-h-[200px] text-sm font-mono placeholder-gray-600 leading-relaxed"
                  rows={Math.min(input.split('\n').length + 1, 8)}
                />
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                     <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                       <span className="text-[10px]">⌘</span>
                       <span>ENTER</span>
                     </span>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && files.length === 0 || agentState.status === 'analyzing'}
                    className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold tracking-wide uppercase ${
                      (!input.trim() && files.length === 0) || agentState.status === 'analyzing'
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {agentState.status === 'analyzing' ? (
                      <span className="flex items-center gap-2">Processing...</span>
                    ) : (
                      <>
                        <span>Execute</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-gray-600 font-mono">
                  Gemini 3 Preview Environment • Context Window: {files.length > 0 ? 'Active' : 'Empty'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}