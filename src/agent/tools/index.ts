import { webSearch } from "./webSearchLocal.ts";
import { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
// All tools combined for the agent
export const tools = {
  webSearch,
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};
