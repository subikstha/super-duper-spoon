import {
  generateText,
  stepCountIs,
  tool,
  type ModelMessage,
  type ToolSet,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { buildMessages, buildMockedTools } from "./utils.ts";
import { MODEL_NAME } from "../src/olama.ts";
import { SYSTEM_PROMPT } from "../dist/agent/system/prompt";

const TOOL_DEFINITIONS: any = {
  webSearch: {
    description: "Search the web for the specified user query",
    parameters: z.object({
      query: z.string().describe("The query that the user wants answer to"),
    }),
  },
  readFile: {
    description: "Read the contents of a file at a specified path",
    parameters: z.object({
      path: z.string().describe("the path to the file that you want to read"),
    }),
  },
  writeFile: {
    description: "Write given contents to the file at the specified path",
    parameters: z.object({
      path: z
        .string()
        .describe("the path to the file that you want to write to"),
      content: z
        .string()
        .describe("the content that you want to write to the file"),
    }),
  },
  listFiles: {
    description: "List all the files in a directory",
    parameters: z.object({
      path: z
        .string()
        .describe(
          "the path of the directory in which you want to list the files",
        ),
    }),
  },
  deleteFile: {
    description: "Delete a file at the given path",
    parameters: z.object({
      path: z.string().describe("the path to the file that you want to delete"),
    }),
  },
  runCommand: {
    description: `Execute a shell command and return its output. Run terminal commands such as:
  - npm install
  - npm test
  - npm run build
  - git status`,
    parameters: z.object({
      command: z.string().describe("the shell command to execute"),
    }),
  },
};

export const singleTurnExecutorWithMocks = async (data: EvalData) => {
  const messages = buildMessages(data);
  console.log("the messages built are", messages);

  const tools: ToolSet = {};

  for (const toolName of data.tools) {
    // Get the definition from tool definition
    const def = TOOL_DEFINITIONS[toolName];

    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.parameters,
      });
    }
  }

  const { toolCalls } = await generateText({
    model: MODEL_NAME,
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,
    // providerOptions: {
    //   openai: {
    //     reasoningEffort: 'high'
    //   }
    // }
  });

  const calls = toolCalls.map((tc) => ({
    toolName: tc.toolName,
    args: "args" in tc ? tc.args : {},
  }));

  const toolNames = toolCalls.map((tc) => tc.toolName);

  console.log("returned value", {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0,
  });

  return {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0,
  };
};

export const multiTurnWithMocks = async (data: MultiTurnEvalData) => {
  const tools = buildMockedTools(data.mockTools);

  const messages: ModelMessage[] = data.messages ?? [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: data.prompt! },
  ];

  const result = await generateText({
    model: MODEL_NAME,
    messages,
    tools,
    stopWhen: stepCountIs(data.config?.maxSteps ?? 20),
  });

  // const allTools

  const allToolCalls: string[] = [];
  const steps = result.steps.map((step) => {
    const stepToolCalls = (step.toolCalls ?? []).map((tc) => {
      allToolCalls.push(tc.toolName);
      return {
        toolName: tc.toolName,
        args: "args" in tc ? tc.args : {},
      };
    });

    const stepToolResults = (step.staticToolResults ?? []).map((tr) => ({
      toolName: tr.toolName,
      result: "results" in tr ? tr.results : tr,
    }));

    return {
      toolCalls: stepToolCalls.length > 0 ? stepToolCalls : undefined,
      toolResults: stepToolResults.length > 0 ? stepToolResults : undefined,
      text: step.text || undefined,
    };
  });

  const toolsUsed = [new Set(allToolCalls)];

  return {
    text: result.text,
    steps,
    toolsUsed,
    toolCallOrder: allToolCalls,
  };
};
