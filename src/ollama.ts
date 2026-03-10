import { createOpenAI } from "@ai-sdk/openai";

export const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1', // Ollama's local OpenAPI endpoint
    apiKey: 'ollama', // Ollama does not need a real key but a string is required by the SDK
})

// Use .chat() to force the standard Chat Completions API (/v1/chat/completions)
// calling the provider directly might default to the newer Responses API which Ollama doesn't support yet.
export const MODEL_NAME = ollama.chat('llama3.2:3b');
export const JUDGE_MODEL_NAME = ollama.chat('tinyllama');