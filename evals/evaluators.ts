import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type {
  EvalTarget,
  SingleTurnResult,
  MultiTurnTarget,
  MultiTurnResult,
} from "./types.ts";
import { JUDGE_MODEL_NAME } from "../src/openai.ts";

// Created a schema for structured output and not free form evaluation
const judgeSchema = z.object({
  score: z.number().min(1).max(10).describe("Score from 1-10 where 10 is perfect"),
  reason: z.string().describe('Brief explanation for the score')
})

/**
 * Evaluator: LLM-as-judge for output quality.
 * Uses structured output to reliably assess if the agent's response is correct.
 * Returns a score from 0-1 (internally uses 1-10 scale divided by 10).
 */
export const llmJudge = async (output: MultiTurnResult, target: MultiTurnTarget) => {
  const result = await generateObject({
    model: JUDGE_MODEL_NAME,
    schema: judgeSchema,
    schemaName: 'evaluation',
    providerOptions: {
      groq: {
        reasoningEffort: "high"
      }
    },
    schemaDescription: "Evaluation of an AI agnet response",
    messages: [
      {
        role: "system",
        content: `You are an evaluation judge. Score the agent's response on a scale of 1-10.

        Scoring criteria:
        - 10: Response fully addresses the task using tool results correctly
        - 7-9: Response is mostly correct with minor issues
        - 4-6: Response partially addresses the task
        - 1-3: Response is mostly incorrect or irrelevant`,
      },
      {
        role: "user",
        content: `Task ${target.originalTask}
        Tools Called: ${JSON.stringify(output.toolCallOrder)}
        Tool Results provided: ${JSON.stringify(target.mockToolResults)}
        Agent's final answer: ${output.text}
        Evaluate if this response correctly uses the tool results to answer the task
        `
      }
    ]
  })

  // Convert 1-10 score to 0-1 range
  return result.object.score / 10;
}

/*
Type SingleTurnResult
interface SingleTurnResult {
toolCalls: Array<{ toolName: string; args: unknown }>;
  /** Just the tool names for easy comparison 
  toolNames: string[];
  /** Whether any tool was selected 
  selectedAny: boolean;
}

Type EvalTarget
interface EvalTarget {
  expectedTools: string[];
  forbiddenTools: string[];
  category: 'golden' | 'negative' | 'secondary'
}
*/

/**
 * Evaluator: Precision/recall score for tool selection.
 * Returns a score between 0 and 1 based on correct selections.
 * For secondary prompts.
 */
export function toolSelectionScore(
  output: SingleTurnResult,
  target: EvalTarget,
): number {
  if (!target.expectedTools?.length) {
    return output.selectedAny ? 0.5 : 1;
  }

  const expected = new Set(target.expectedTools);
  const selected = new Set(output.toolNames);

  const hits = output.toolNames.filter((t) => expected.has(t)).length;
  const precision = selected.size > 0 ? hits / selected.size : 0;
  const recall = expected.size > 0 ? hits / expected.size : 0;

  // Simple F1-ish score
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}
