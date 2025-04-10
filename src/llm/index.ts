import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

// Google Gemini Configuration
const googleGemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: import.meta.env.VITE_GEMINI_API_KEY!,
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
});

// OpenAI Configuration
const openAI = new ChatOpenAI({
  modelName: "gpt-4",
  apiKey: import.meta.env.VITE_OPENAI_API_KEY!,
  temperature: 1,
});

// Export the LLM models
export const llmModels = {
  googleGemini,
  openAI,
};