
import { generateText, stepCountIs, tool, type ToolSet } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { buildMessages } from './utils.ts';
import { MODEL_NAME } from '../src/ollama.ts';

const TOOL_DEFINITIONS: any = {
  readFile: {
    description: 'Read the contents of a file at a specified path',
    parameters: z.object({
      path: z.string().describe('the path to the file that you want to read')
    })
  },
  writeFile: {
    description: 'Write given contents to the file at the specified path',
    parameters: z.object({
      path: z.string().describe('the path to the file that you want to write to'),
      content: z.string().describe('the content that you want to write to the file')
    })
  },
  listFiles: {
    description: 'List all the files in a directory',
    parameters: z.object({
      path: z.string().describe('the path of the directory in which you want to list the files')
    })
  },
  deleteFile: {
    description: 'Delete a file at the given path',
    parameters: z.object({
      path: z.string().describe('the path to the file that you want to delete')
    })
  },
  runCommand: {
    description: 'Execute a shell command and return its output',
    parameters: z.object({
      command: z.string().describe('the shell command to execute')
    })
  }
}

export const singleTurnExecutorWithMocks = async (data: EvalData) => {
  const messages = buildMessages(data)

  const tools: ToolSet = {}

  for (const toolName of data.tools) {
    // Get the definition from tool definition
    const def = TOOL_DEFINITIONS[toolName]

    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.parameters
      })
    }
  }

  const { toolCalls } = await generateText({
    model: MODEL_NAME,
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined
  })

  const calls = toolCalls.map((tc) => ({
    toolName: tc.toolName,
    args: "args" in tc ? tc.args : {}
  }))

  const toolNames = toolCalls.map((tc) => tc.toolName)

  return {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0
  }
}