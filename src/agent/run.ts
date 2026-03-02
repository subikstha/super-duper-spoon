import 'dotenv/config'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { tools } from './tools'
import { executeTool } from './executeTools'
import { SYSTEM_PROMPT } from './system/prompt'

// This works for both Groq and Grok (xAI) as they are OpenAI-compatible.
// If using Groq: baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY
// If using Grok (xAI): baseURL: 'https://api.x.ai/v1', apiKey: process.env.XAI_API_KEY

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

const MODEL_NAME = groq('llama-3.1-8b-instant')

export const runAgent = async (
    userMessage: string,
    conversationHistory?: any,
    callbacks?: any
) => {
    // We can also destructure toolCalls along side the text after we start using tools
    const { text, toolCalls } = await generateText({
        model: MODEL_NAME,
        prompt: userMessage,
        system: SYSTEM_PROMPT,
        tools,
        toolChoice: 'auto' // Default is auto
    })

    console.log('Agent Response:', text, toolCalls)
    return text
}

// Example usage
runAgent('What is the current date and time?')
