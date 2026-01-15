import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AgentMode, AgentState, FileContext, Message, ViewMode } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { generateDependencyGraph } from './services/dependencyService';
import { fetchGithubRepo } from './services/githubService';
import { FileTree } from './components/FileTree';
import { MessageBubble } from './components/MessageBubble';
import { DependencyGraph } from './components/DependencyGraph';
import { Send, Zap, BrainCircuit, MessageSquare, Network, Cpu, Command, Bug, PlayCircle, Trash2, Brain, Layout } from 'lucide-react';

// Storage keys for persistence
const STORAGE_KEYS = {
  MESSAGES: 'codeagent_messages',
  FILES: 'codeagent_files'
};

const DEFAULT_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "# CodeAgent X Online \n\nI am ready to analyze your repository. I can visualize dependencies, debug stack traces, and architect solutions.\n\n### Capabilities\n\n*   **Deep Reasoning**: I use Gemini 3 to think through complex bugs.\n*   **Full Context**: Upload your whole `src` folder for holistic understanding.\n*   **Visual Engineering**: View the architecture graph to spot coupling issues.\n*   **Autonomous Debugging**: Enable 'Debug' mode to verify fixes before applying them.",
  timestamp: Date.now()
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
    return [DEFAULT_MESSAGE];
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
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      setLastSaved(Date.now());
    } catch (e) {
      console.error('Failed to save messages to local storage (likely quota exceeded):', e);
    }
  }, [messages]);

  // Persist files whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
      setLastSaved(Date.now());
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
    if (mode === AgentMode.ARCHITECT || mode === AgentMode.DEBUG) {
      setThinkingBudget(4096);
    } else {
      setThinkingBudget(0);
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to reset the session? This will delete all chat history and loaded files locally.")) {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.FILES);
      setMessages([DEFAULT_MESSAGE]);
      setFiles([]);
      setAgentState({ status: 'idle' });
      setViewMode(ViewMode.CHAT);
    }
  };

  const graphData = useMemo(() => generateDependencyGraph(files), [files]);

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

      const responseText = await sendMessageToGemini(
        prompt,
        AgentMode.ARCHITECT,
        currentFiles,
        [],
        null,
        Math.max(thinkingBudget, 2048)
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
          ? { ...msg, text: "System Error: Automated analysis failed.", isThinking: false }
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
        text: `> System Notification: Imported ${repoFiles.length} files from ${url}. Initializing Analysis Protocol...`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);

      await triggerAutoAnalysis(updatedFiles, repoFiles.length, 'github');
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `Error: GitHub Import Failed. ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setAgentState({ status: 'error' });
    } finally {
      setIsImporting(false);
      if (agentState.status === 'error') {
        setTimeout(() => setAgentState({ status: 'idle' }), 2000);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAgentState({ status: 'analyzing' });

      const newFiles: FileContext[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');

        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const content = event.target?.result as string;
            const finalContent = isImage ? content.split(',')[1] : content;
            let type: FileContext['type'] = 'file';
            const lowerName = file.name.toLowerCase();
            if (isImage) { type = 'image'; }
            else if (lowerName.endsWith('.log')) { type = 'log'; }
            else if (lowerName.endsWith('.json') || lowerName.endsWith('.csv')) { type = 'metric'; }
            else if (lowerName.includes('issue') || lowerName.includes('report')) { type = 'issue'; }

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
          if (isImage) reader.readAsDataURL(file);
          else reader.readAsText(file);
        });
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      e.target.value = '';
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

    const thinkingMsgId = 'thinking-' + Date.now();
    setMessages(prev => [...prev, {
      id: thinkingMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      if (agentMode === AgentMode.DEBUG) {
        // --- DEBUG MODE FLOW ---

        // Step 1: Generate Initial Fix
        const draftResponseText = await sendMessageToGemini(
          userMsg.text,
          AgentMode.ARCHITECT,
          files,
          [],
          null,
          thinkingBudget
        );
        const draft = processResponse(draftResponseText);

        // Step 2: Verify Fix
        setAgentState({ status: 'verifying' });

        const verificationPrompt = `
          I have generated a potential solution. Now act as a QA Simulation Environment.
          
          Proposed Solution:
          ${draft.text}
          
          Your Task:
          1. Mentally simulate running this code against the provided file context.
          2. Check for syntax errors, logical flaws, memory leaks, or race conditions.
          3. Determine if it fully addresses the user's original request: "${userMsg.text}".
          
          Output Format:
          If verified: "STATUS: VERIFIED"
          If failed: "STATUS: FAILED \n [Detailed reasons why]"
        `;

        const verificationResponseText = await sendMessageToGemini(
          verificationPrompt,
          AgentMode.ARCHITECT,
          files,
          [{ role: 'user', parts: [{ text: userMsg.text }] }, { role: 'model', parts: [{ text: draftResponseText }] }],
          null,
          2048 // Lower budget for QA
        );
        const verification = processResponse(verificationResponseText);

        let finalThoughts = draft.thoughts || "";
        finalThoughts += `\n\n### 🔍 QA Verification Simulation\n${verification.thoughts || "Executing mental sandbox test suite..."}\n\n**Result:** ${verification.text.includes("STATUS: VERIFIED") ? "Pass" : "Fail"}`;

        if (verification.text.includes("STATUS: VERIFIED")) {
          // Success path
          setMessages(prev => prev.map(msg =>
            msg.id === thinkingMsgId
              ? { ...msg, text: draft.text, thoughts: finalThoughts, isThinking: false }
              : msg
          ));
        } else {
          // Failure & Fix Path
          setAgentState({ status: 'writing' }); // Refining

          const refinementPrompt = `
             The verification simulation failed with the following errors:
             ${verification.text}
             
             Please REWRITE the solution to fix these specific issues. 
             Provide the complete, corrected code.
           `;

          const finalFixResponseText = await sendMessageToGemini(
            refinementPrompt,
            AgentMode.ARCHITECT,
            files,
            [
              { role: 'user', parts: [{ text: userMsg.text }] },
              { role: 'model', parts: [{ text: draftResponseText }] },
              { role: 'user', parts: [{ text: verificationPrompt }] },
              { role: 'model', parts: [{ text: verificationResponseText }] }
            ],
            null,
            4096
          );
          const finalFix = processResponse(finalFixResponseText);

          finalThoughts += `\n\n### 🛠️ Autonomous Repair\nDetected failure in simulation. Applying fixes based on QA feedback.\n${finalFix.thoughts || ""}`;

          setMessages(prev => prev.map(msg =>
            msg.id === thinkingMsgId
              ? { ...msg, text: finalFix.text, thoughts: finalThoughts, isThinking: false }
              : msg
          ));
        }

      } else {
        // --- STANDARD MODES ---
        const responseText = await sendMessageToGemini(
          userMsg.text,
          agentMode,
          files,
          [],
          null,
          thinkingBudget
        );

        const { text, thoughts } = processResponse(responseText);

        setMessages(prev => prev.map(msg =>
          msg.id === thinkingMsgId
            ? { ...msg, text: text, thoughts: thoughts, isThinking: false }
            : msg
        ));
      }

      setAgentState({ status: 'idle' });

    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsgId
          ? { ...msg, text: "Critical Failure: Unable to generate response.", isThinking: false }
          : msg
      ));
      setAgentState({ status: 'error' });
    }
  };

  const handleCodeReview = async (code: string, language: string) => {
    setAgentState({ status: 'analyzing' });
    const reviewPrompt = `
      Please review the following ${language} code snippet. 
      Focus on: Potential bugs, security, code style, and performance.
      Code to Review:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const thinkingMsgId = 'review-' + Date.now();
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
      const responseText = await sendMessageToGemini(
        reviewPrompt,
        AgentMode.ARCHITECT,
        files,
        [],
        null,
        2048
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
          ? { ...msg, text: "Code review process failed.", isThinking: false }
          : msg
      ));
      setAgentState({ status: 'error' });
    }
  };

  const handleApplyChange = (fileName: string, newContent: string) => {
    setFiles(prev => {
      const existing = prev.find(f => f.name === fileName || f.name.endsWith('/' + fileName));
      if (existing) {
        return prev.map(f => f.id === existing.id ? { ...f, content: newContent } : f);
      } else {
        // Create new file
        return [...prev, {
          id: Math.random().toString(36).substring(7),
          name: fileName,
          content: newContent,
          type: 'file'
        }];
      }
    });

    // Notify user
    const systemMsg: Message = {
      id: 'apply-' + Date.now(),
      role: 'model',
      text: `> System Notification: Applied changes to \`${fileName}\`. Base state updated.`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusText = () => {
    switch (agentState.status) {
      case 'analyzing': return 'Reasoning...';
      case 'verifying': return 'Simulating...';
      case 'writing': return 'Refining Fix...';
      case 'error': return 'System Error';
      default: return 'Online';
    }
  };

  const getStatusColor = () => {
    switch (agentState.status) {
      case 'analyzing': return 'bg-neon-purple shadow-[0_0_10px_rgba(167,139,250,0.5)]';
      case 'verifying': return 'bg-neon-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]';
      case 'writing': return 'bg-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      case 'error': return 'bg-neon-rose shadow-[0_0_10px_rgba(251,113,133,0.5)]';
      default: return 'bg-neon-emerald shadow-[0_0_10px_rgba(52,211,153,0.5)]';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-obsidian-950 text-gray-200 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-obsidian-900 via-obsidian-950 to-black selection:bg-neon-cyan/20 selection:text-neon-cyan">

      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* File Tree Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out relative z-20 flex shrink-0 border-r border-white/5 bg-obsidian-900/40 backdrop-blur-xl overflow-hidden`}>
        <div className="w-64 h-full">
          <FileTree
            files={files}
            onRemove={removeFile}
            onUpload={handleFileUpload}
            onGithubImport={handleGithubImport}
            isImporting={isImporting}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative z-10">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-obsidian-950/20 backdrop-blur-sm z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-white transition-colors">
              <Layout size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-cyan/20 blur-md rounded-full"></div>
                <div className="w-8 h-8 relative bg-gradient-to-br from-obsidian-800 to-obsidian-950 rounded-lg border border-white/10 flex items-center justify-center text-neon-cyan shadow-lg">
                  <Cpu size={16} />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-gray-100 tracking-tight leading-none text-sm">CodeAgent X</h1>
                <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">Gemini 3 Powered</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 ml-4">
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} animate-pulse`}></span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wide">
                {getStatusText()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Switcher */}
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
              <button
                onClick={() => setViewMode(ViewMode.CHAT)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide ${viewMode === ViewMode.CHAT
                  ? 'bg-obsidian-700 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <MessageSquare size={12} />
                Chat
              </button>
              <button
                onClick={() => setViewMode(ViewMode.GRAPH)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide ${viewMode === ViewMode.GRAPH
                  ? 'bg-obsidian-700 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Network size={12} />
                Map
              </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10"></div>

            {/* Agent Mode Switcher */}
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
              <button
                onClick={() => handleModeChange(AgentMode.ARCHITECT)}
                title="Gemini 3 Pro (Thinking)"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide ${agentMode === AgentMode.ARCHITECT
                  ? 'bg-neon-purple/10 text-neon-purple ring-1 ring-neon-purple/30'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <BrainCircuit size={12} />
                Think
              </button>
              <button
                onClick={() => handleModeChange(AgentMode.DEBUG)}
                title="Gemini 3 Pro (Self-Correction Loop)"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide ${agentMode === AgentMode.DEBUG
                  ? 'bg-neon-amber/10 text-neon-amber ring-1 ring-neon-amber/30'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Bug size={12} />
                Debug
              </button>
              <button
                onClick={() => handleModeChange(AgentMode.FAST)}
                title="Gemini 3 Flash (Fast)"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide ${agentMode === AgentMode.FAST
                  ? 'bg-neon-cyan/10 text-neon-cyan ring-1 ring-neon-cyan/30'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Zap size={12} />
                Fast
              </button>
            </div>

            {/* Settings/Reset */}
            <div className="flex items-center">
              <button
                onClick={handleResetSession}
                className="p-2 rounded-lg text-gray-500 hover:text-neon-rose hover:bg-neon-rose/10 transition-colors"
                title="Clear Session"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === ViewMode.CHAT ? (
            <main className="h-full overflow-y-auto p-0 scroll-smooth pb-0">
              {/* Messages Container with Max Width for readability */}
              <div className="w-full max-w-5xl mx-auto min-h-full flex flex-col pt-6 px-6">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCodeReview={handleCodeReview}
                    onApplyChange={handleApplyChange}
                  />
                ))}
                <div ref={messagesEndRef} className="h-32 shrink-0" /> {/* Spacer for floating input */}
              </div>
            </main>
          ) : (
            <main className="h-full w-full bg-obsidian-950 relative">
              <DependencyGraph data={graphData} />
            </main>
          )}
        </div>

        {/* Floating Input Capsule */}
        {viewMode === ViewMode.CHAT && (
          <div className="absolute bottom-8 left-0 right-0 z-40 px-6 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              <div className={`
                 relative backdrop-blur-xl bg-obsidian-900/80 rounded-2xl p-1.5 transition-all duration-300 
                 border border-white/10 shadow-2xl shadow-black/50
                 focus-within:ring-1 focus-within:shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]
                 ${agentMode === AgentMode.DEBUG ? 'focus-within:ring-neon-amber/40 border-neon-amber/20' : 'focus-within:ring-neon-cyan/40'}
              `}>
                {/* Reasoning Budget Badge (Only for thinking modes) */}
                {agentMode !== AgentMode.FAST && (
                  <div className="absolute -top-3 left-6 flex items-center gap-1.5 bg-obsidian-950 border border-white/10 px-2 py-0.5 rounded-full text-[9px] text-gray-400 font-mono shadow-sm">
                    <Brain size={10} className="text-neon-purple" />
                    <span>BUDGET: {(thinkingBudget / 1024).toFixed(0)}k</span>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      agentMode === AgentMode.DEBUG
                        ? "Describe the bug, paste stack trace, or link to issue..."
                        : files.length > 0 ? "Ask a question about the codebase..." : "Initialize CodeAgent..."
                    }
                    className="w-full bg-transparent border-none text-gray-200 p-4 pr-12 focus:ring-0 resize-none min-h-[60px] max-h-[200px] text-sm font-sans placeholder-gray-500 leading-relaxed custom-scrollbar"
                    rows={1}
                    style={{ height: 'auto', minHeight: '60px' }}
                  />
                  <div className="absolute right-2 bottom-2">
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && files.length === 0 || agentState.status !== 'idle'}
                      className={`p-2 rounded-xl transition-all flex items-center justify-center ${(!input.trim() && files.length === 0) || agentState.status !== 'idle'
                        ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                        : agentMode === AgentMode.DEBUG
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-obsidian-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                          : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-obsidian-950 hover:brightness-110 shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                      {agentState.status !== 'idle' ? (
                        <div className="w-5 h-5 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin"></div>
                      ) : (
                        agentMode === AgentMode.DEBUG ? <Bug size={18} strokeWidth={2.5} /> : <Send size={18} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Context Footer inside Input */}
                <div className="px-4 pb-2 flex items-center gap-4 border-t border-white/5 pt-2">
                  <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1.5 group cursor-help">
                    <div className="p-0.5 rounded border border-gray-700 bg-white/5 group-hover:bg-white/10 transition-colors"><Command size={8} /></div>
                    <span>Return to send</span>
                  </span>
                  <div className="h-3 w-[1px] bg-white/10"></div>
                  <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1.5">
                    <span className={files.length > 0 ? "text-neon-emerald" : "text-gray-500"}>{files.length} files loaded</span>
                  </span>
                  {agentMode === AgentMode.DEBUG && (
                    <span className="text-[10px] text-neon-amber font-mono flex items-center gap-1.5 ml-auto animate-pulse">
                      <PlayCircle size={10} /> Auto-Verification
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}