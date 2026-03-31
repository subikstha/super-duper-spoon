import { createOpenAI } from "@ai-sdk/openai";

export const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: "ollama",
});

export const JUDGE_MODEL_NAME = ollama.chat("llama3.2:3b");
export const MODEL_NAME = ollama.chat("qwen2.5:1.5b");
// export const MODEL_NAME = ollama.chat('phi3:latest')
