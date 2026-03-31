import { type ModelMessage, type ToolSet } from "ai";
import type { EvalData, MultiTurnEvalData } from "./types.ts";
/**
 * Build mocked tools from data config.
 * Each tool returns its configured mockReturn value.
 */
export declare const buildMockedTools: (mockTools: MultiTurnEvalData["mockTools"]) => ToolSet;
/**
 * Build message array from eval data
 */
export declare const buildMessages: (data: EvalData | {
    prompt?: string;
    systemPrompt?: string;
}) => ModelMessage[];
export declare function extractCurrencies(query: string): {
    from: string;
    to: string;
};
