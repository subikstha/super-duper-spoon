import { singleTurnExecutorWithMocks } from "./executors";
import type { EvalData } from "./types";
import dataset from "./data/websearch-tools.json" with { type: "json" };
import { evaluate } from "@lmnr-ai/lmnr";
import { toolSelectionScore } from "./evaluators";

const executor = (data: EvalData) => {
  return singleTurnExecutorWithMocks(data);
};
evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    // Here selectionScore is what will come up in the Laminar dashboard
    selectionScore: (output: any, target: any) => {
      if (target?.category === "secondary") return 1;

      return toolSelectionScore(output, target);
    },
  },
  groupName: "websearch-tools-selection", // The group name can be used to distinguish between different experiments
});
