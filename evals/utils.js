import { tool } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../src/agent/system/prompt.js";
/**
 * Build mocked tools from data config.
 * Each tool returns its configured mockReturn value.
 */
export const buildMockedTools = (mockTools) => {
    const tools = {};
    for (const [name, config] of Object.entries(mockTools)) {
        // Build parameter schema dynamically
        const paramSchema = {};
        for (const paramName of Object.keys(config.parameters)) {
            paramSchema[paramName] = z.string();
        }
        tools[name] = tool({
            description: config.description,
            inputSchema: z.object(paramSchema),
            execute: async () => config.mockReturn,
        });
    }
    return tools;
};
/**
 * Build message array from eval data
 */
export const buildMessages = (data) => {
    const systemPrompt = data.systemPrompt ?? SYSTEM_PROMPT;
    return [
        { role: "system", content: systemPrompt },
        { role: "user", content: data.prompt },
    ];
};
// Utility to extract currencies
export function extractCurrencies(query) {
    const regex = /\b([A-Z]{3})\b/g;
    const matches = query.match(regex);
    if (!matches || matches.length === 0)
        return { from: "USD", to: "USD" }; // This is the default
    return {
        from: matches[0], // first currency
        to: matches[1], // second currency
    };
}
