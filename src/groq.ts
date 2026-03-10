import { createOpenAI } from "@ai-sdk/openai";

export const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

export const MODEL_NAME = groq('llama-3.1-8b-instant')
export const JUDGE_MODEL_NAME = groq('qwen/qwen3-32b')