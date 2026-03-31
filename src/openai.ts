import {openai} from "@ai-sdk/openai";

export const MODEL_NAME = openai('gpt-5-mini');
export const JUDGE_MODEL_NAME = openai('gpt-5.4-mini');