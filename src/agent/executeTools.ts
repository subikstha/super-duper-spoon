import { tools } from "./tools/index.js";
export type ToolName = keyof typeof tools;

export const executeTool = async (name: string, args: any) => {
    const tool = tools[name as ToolName];
    if (!tool) {
        return 'Unknown tool, this tool does not exist';
    }

    const execute = tool.execute // Not tool will have the execute function so

    if (!execute) {
        return 'This is not a registered tool'
    }

    const result = await execute(args, {
        toolCallId: '', // THe SDK wants us to pass a tool call id
        messages: []
    })

    return String(result)
}