import 'dotenv/config'
import { streamText, type ModelMessage } from 'ai'
import { tools } from './tools/index.js'
import { MODEL_NAME } from '../olama.ts'
import { executeTool } from './executeTools.js'
import { SYSTEM_PROMPT } from './system/prompt.js'
import { getTracer, Laminar } from '@lmnr-ai/lmnr'
import type { AgentCallbacks, ToolCallInfo } from '../types.js'
import { filterCompatibleMessages } from './system/filterMessages.js'

// This works for both Groq and Grok (xAI) as they are OpenAI-compatible.
// If using Groq: baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY
// If using Grok (xAI): baseURL: 'https://api.x.ai/v1', apiKey: process.env.XAI_API_KEY



Laminar.initialize({
    projectApiKey: process.env.LMNR_PROJECT_API_KEY
})

export const runAgent = async (
    userMessage: string,
    conversationHistory: ModelMessage[] = [],
    callbacks?: AgentCallbacks
): Promise<ModelMessage[]> => {
    const workingHistory = filterCompatibleMessages(conversationHistory)

    const messages: ModelMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...workingHistory,
        { role: 'user', content: userMessage }
    ]

    let fullResponse = ""

    while (true) {
        const result = streamText({
            model: MODEL_NAME,
            messages,
            tools,
            experimental_telemetry: {
                isEnabled: true,
                tracer: getTracer()
            }
        })

        const toolCalls: ToolCallInfo[] = []
        let currentText = ""
        let streamError: Error | null = null

        try {
            for await (const chunk of result.fullStream) {
                if (chunk.type === 'text-delta') {
                    // This means that a new token came in, the LLM is still saying something
                    currentText += chunk.text
                    callbacks?.onToken(chunk.text) // This is what puts it in the terminal
                }

                if (chunk.type === 'tool-call') {
                    const input = 'input' in chunk ? chunk.input : {}
                    toolCalls.push({
                        toolCallId: chunk.toolCallId,
                        toolName: chunk.toolName,
                        args: input as any // TODO: TS
                    })
                    // Show that the llm is tyring to call a tool in the UI
                    callbacks?.onToolCallStart(chunk.toolName, input)
                }
            }
        } catch (e) {
            streamError = e as Error
            if (!currentText && !streamError.message.includes('No output generated')) {
                throw streamError
            }
        }

        fullResponse += currentText
        if (streamError && !currentText) {
            fullResponse = "Sorry about that. We are working on it!"
            callbacks?.onToken(fullResponse)
            messages.push({ role: 'assistant', content: fullResponse })
            break; // We break here bcoz there was an error and we just send the sorry message
        }

        const finishReason = await result.finishReason
        if (finishReason !== 'tool-calls' || toolCalls.length === 0) {
            const responseMessages = await result.response
            // Since the LLM will not know that it generated a message, we need to manually append the responseMessages to the messages
            messages.push(...responseMessages.messages)
            break;
        }

        // Now at this point we can assume that a tool call was made at this point
        const responseMessage = await result.response;
        messages.push(...responseMessage.messages) // Still need to add the tool call in the messages

        for (const tc of toolCalls) {
            const result = await executeTool(tc.toolName, tc.args)
            callbacks?.onToolCallEnd(tc.toolName, result)
            messages.push({
                role: 'tool',
                content: [
                    {
                        type: 'tool-result',
                        toolCallId: tc.toolCallId,
                        toolName: tc.toolName,
                        output: {
                            type: 'text',
                            value: result
                        }
                    }
                ]
            })
        }


    }
    // We can also destructure toolCalls along side the text after we start using tools
    // const result = await generateText({
    //     model: MODEL_NAME,
    //     prompt: userMessage,
    //     // messages: [], We can pass an array called messages which includes the past conversations if not passing a single prompt
    //     // It is an array of objects where each object is of type {role: 'user', content: 'actual message'}
    //     // If the last message in the messages array contains an object with role: 'user', then the LLM will respond to that 
    //     system: SYSTEM_PROMPT,
    //     tools,
    //     toolChoice: 'auto', // Default is auto
    //     experimental_telemetry: { // This is used to visualize everything that our agent does
    //         isEnabled: true,
    //         tracer: getTracer()
    //     }
    // })
    callbacks?.onComplete(fullResponse)
    return messages;
}

/*
A sample log of the toolCalls array of object looks like this

Agent Response:  [
  {
    type: 'tool-call',
    toolCallId: 'h3tvgywd1', this toolCallId is generated by the provider, which in this case is groq
    toolName: 'dateTime',
    input: {},
    providerExecuted: undefined,
    providerMetadata: { openai: [Object] }
  }
]
*/

// Example usage
