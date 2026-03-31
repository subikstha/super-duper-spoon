import { dateTime } from "./dateTime.js";
import { webSearch } from "./webSearch.ts";
import { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
// All tools combined for the agent
export const tools = {
  dateTime,
  webSearch,
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};
