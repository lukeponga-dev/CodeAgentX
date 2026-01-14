import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgentMode, FileContext } from '../types';

// Initialize the client.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTION = `
You are CodeAgent X, an elite autonomous senior software engineer and architect. 
You are powered by Gemini 3.

Your Capabilities:
1. **Repository Reasoning:** You can analyze multiple code files to understand dependencies, patterns, and architecture.
2. **Visual Analysis:** You can interpret architectural diagrams, UI mockups, and error screenshots.
3. **Advanced Diagnostics:** You possess advanced capabilities in Root Cause Analysis (RCA). You parse stack traces, correlate them with performance metrics (JSON/CSV) and user reports to pinpoint defects.
4. **Iterative Fixing:** You produce high-quality, review-ready code fixes.

Diagnostic Protocol:
- **Correlate:** Look for temporal alignment between log timestamps and metric spikes (e.g., latency, memory).
- **Triangulate:** Use user reports to understand the reproduction steps, then verify against logs and code.
- **Trace:** Follow the error from the stack trace into the codebase context provided.

Guidelines:
- **Be Concise but Thorough:** Explain your reasoning briefly, then provide the solution.
- **Code First:** Prioritize showing code over long textual explanations when a fix is requested.
- **Modern Standards:** Use modern best practices (e.g., React 18+, TypeScript, ESModules).
- **Context Aware:** Always consider the files provided in the context when answering.
- **Show Your Thinking:** When solving complex problems, FIRST outline your reasoning process inside <thinking>...</thinking> tags. This helps the user understand your diagnostic path.
  - Example: <thinking>The error implies a race condition. I see a useEffect in App.tsx that doesn't clean up...</thinking>

When generating code, wrap it in markdown code blocks with the language specified.
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getRetryDelay = (error: any): number => {
  const actualError = error.error || error;

  if (actualError.details && Array.isArray(actualError.details)) {
    const retryInfo = actualError.details.find((d: any) => d['@type'] && d['@type'].includes('RetryInfo'));
    if (retryInfo && retryInfo.retryDelay) {
      const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
      if (!isNaN(seconds)) return (seconds + 1) * 1000;
    }
  }
  
  const message = actualError.message || '';
  const match = message.match(/retry in (\d+(\.\d+)?)s/);
  if (match && match[1]) {
    return (parseFloat(match[1]) + 1) * 1000;
  }

  return 0;
};

export const sendMessageToGemini = async (
  prompt: string,
  mode: AgentMode,
  contextFiles: FileContext[],
  history: { role: string; parts: { text: string }[] }[],
  relevantFileIds: string[] | null = null,
  thinkingBudget: number = 0
): Promise<string> => {
  
  const modelName = mode === AgentMode.ARCHITECT 
    ? 'gemini-3-pro-preview' 
    : 'gemini-3-flash-preview';

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (thinkingBudget > 0) {
    config.thinkingConfig = { thinkingBudget };
  }

  const contentParts: any[] = [];

  const filesToInclude = relevantFileIds 
    ? contextFiles.filter(f => relevantFileIds.includes(f.id))
    : contextFiles;

  if (filesToInclude.length > 0) {
    const contextDescription = "Here is the active file context and failure signals for your analysis:\n";
    contentParts.push({ text: contextDescription });

    filesToInclude.forEach(file => {
      if (file.type === 'image') {
        contentParts.push({
          inlineData: {
            mimeType: file.mimeType || 'image/png',
            data: file.content
          }
        });
        contentParts.push({ text: `\n[Image: ${file.name}]\n` });
      } else if (file.type === 'metric') {
        contentParts.push({
          text: `\n--- START OF METRICS (DATA: ${file.name}) ---\n${file.content}\n--- END OF METRICS ---\n`
        });
      } else if (file.type === 'issue') {
        contentParts.push({
          text: `\n--- START OF USER REPORT (${file.name}) ---\n${file.content}\n--- END OF REPORT ---\n`
        });
      } else if (file.type === 'log') {
        contentParts.push({
          text: `\n--- START OF LOGS (${file.name}) ---\n${file.content}\n--- END OF LOGS ---\n`
        });
      } else {
        contentParts.push({
          text: `\n--- START OF CODE FILE ${file.name} ---\n${file.content}\n--- END OF FILE ---\n`
        });
      }
    });
  }

  contentParts.push({ text: prompt });

  let retries = 0;
  const MAX_RETRIES = 5;
  
  while (retries <= MAX_RETRIES) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: {
          role: 'user',
          parts: contentParts
        },
        config: config
      });

      return response.text || "I analyzed the input but could not generate a textual response.";

    } catch (error: any) {
      const actualError = error.error || error;
      
      // Basic detection of rate limit/quota errors
      const status = actualError?.status;
      const code = actualError?.code;
      const message = actualError?.message || '';

      const isQuotaError = 
        status === 429 || 
        code === 429 || 
        status === 503 ||
        status === 'RESOURCE_EXHAUSTED' ||
        message.includes('429') || 
        message.includes('Quota exceeded') ||
        message.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError && retries < MAX_RETRIES) {
        retries++;
        
        let delay = getRetryDelay(error);
        
        if (delay === 0) {
            delay = 2000 * Math.pow(2, retries); 
        }

        console.warn(`Gemini API Quota/Rate Limit. Waiting ${delay}ms before retry (Attempt ${retries}/${MAX_RETRIES})`);
        await wait(delay);
        continue;
      }
      
      console.error("Gemini API Error:", error);
      
      if (isQuotaError) {
        return `Error: System overloaded or quota exceeded. The model asked to wait, but retries were exhausted after ${retries} attempts. \n\nTip: Try switching to **FAST** mode (Gemini Flash) which has higher limits.`;
      }

      const errorMessage = actualError instanceof Error ? actualError.message : (message || "Unknown error occurred");
      return `Error: ${errorMessage}`;
    }
  }
  
  return "Error: Failed to connect to Gemini API after multiple attempts.";
};