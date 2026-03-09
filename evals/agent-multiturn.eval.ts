import { evaluate } from "@lmnr-ai/lmnr";
import { llmJudge } from "./evaluators";

import type {
    MultiTurnEvalData,
    MultiTurnDatasetEntry,
    MultiTurnResult,
    MultiTurnTarget
} from './types'

import dataset from './data/agent-multiturn.json' with {type: 'json'}
import { multiTurnWithMocks } from "./executors";

const executor = async (data: MultiTurnEvalData) => {
    // This pass through function is created so that we may have to manipulate the data before passing it to the multiTurnWithMocks function
    return multiTurnWithMocks(data)
}

evaluate({
    data: dataset as any,
    executor,
    evaluators: {
        // This function inside evaluators will always receiver output and target as the parameters
        outputQuality: async (output: any, target: any) => {
            if (!target) return 1;
            return llmJudge(output, target)
        }
    },
    config: {
        projectApiKey: process.env.LMNR_PROJECT_API_KEY
    },
    // Group name is what we want to call this set of experiments
    groupName: 'agent-multiturn'
})