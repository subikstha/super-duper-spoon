import { evaluate } from "@lmnr-ai/lmnr";
import type { EvalData } from "./types";
import dataset from './data/shell-tools.json' with {type: 'json'}
import { singleTurnExecutorWithMocks } from "./executors";
import { toolSelectionScore } from "./evaluators";


const executor = async (data: EvalData) => {
    return singleTurnExecutorWithMocks(data)
}

evaluate({
    data: dataset as any,
    executor,
    evaluators: {
        selectionScore: (output: any, target: any) => {
            if (target.category === 'secondary') return 1;

            return toolSelectionScore(output, target)
        }
    },
    groupName: 'shell-tools-selection'
})