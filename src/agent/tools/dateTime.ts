import { tool } from 'ai'
import { z } from 'zod'

export const dateTime = tool({
    description: 'Returns the current time and date. Use this tool before any time related task',
    inputSchema: z.object({}), // empty since no arguments needed for date time
    execute: async () => { // This is the actual function that gets executed whent he agent wants us to run the function
        return `The current date time in iso format is: ${new Date().toISOString()}`; // we return a string because an input to an LLM is always a string
    }
})