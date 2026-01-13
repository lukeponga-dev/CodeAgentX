import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgentMode, FileContext } from '../types';

// Initialize the client. 
// API Key is guaranteed to be in process.env.API_KEY per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are DevAgent, an elite autonomous senior software engineer and architect. 
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

When generating code, wrap it in markdown code blocks with the language specified.
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (
  prompt: string,
  mode: AgentMode,
  contextFiles: FileContext[],
  history: { role: string; parts: { text: string }[] }[],
  relevantFileIds: string[] | null = null
): Promise<string> => {
  
  // 1. Select Model based on Mode
  const modelName = mode === AgentMode.ARCHITECT 
    ? 'gemini-3-pro-preview' 
    : 'gemini-3-flash-preview';

  // 2. Prepare Config
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  // Enable thinking for Architect mode for deep reasoning
  if (mode === AgentMode.ARCHITECT) {
    config.thinkingConfig = { thinkingBudget: 4096 }; // Allocate token budget for reasoning
  }

  // 3. Construct Content Parts
  // We prepend the "Repository Context" to the user's prompt to simulate having access to the repo.
  const contentParts: any[] = [];

  // Determine which files to include in the context
  const filesToInclude = relevantFileIds 
    ? contextFiles.filter(f => relevantFileIds.includes(f.id))
    : contextFiles;

  // Add context files first
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

  // Add the actual user prompt
  contentParts.push({ text: prompt });

  let retries = 0;
  const MAX_RETRIES = 3;
  
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
      // Basic detection of rate limit/quota errors
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.status === 503 ||
        error?.message?.includes('429') || 
        error?.message?.includes('Quota exceeded') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError && retries < MAX_RETRIES) {
        retries++;
        // Exponential backoff: 2s, 4s, 8s
        const delay = 1000 * Math.pow(2, retries);
        console.warn(`Gemini API Quota/Rate Limit. Retrying in ${delay}ms... (Attempt ${retries}/${MAX_RETRIES})`);
        await wait(delay);
        continue;
      }
      
      console.error("Gemini API Error:", error);
      
      if (isQuotaError) {
        return "Error: System is currently overloaded or quota exceeded. Please try again in a few moments or switch to FAST mode.";
      }

      return `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
    }
  }
  
  return "Error: Failed to connect to Gemini API after multiple attempts.";
};