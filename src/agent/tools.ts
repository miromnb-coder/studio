import { Tool } from "./types";

export const tools: Tool[] = [
  {
    name: "memory.read",
    description: "Read user memory",
    execute: async () => {
      return [{ type: "goal", content: "Save money monthly" }];
    },
  },
  {
    name: "memory.write",
    description: "Write to memory",
    execute: async (input) => {
      console.log("Saving memory:", input);
      return { success: true };
    },
  },
  {
    name: "web.search",
    description: "Search the web",
    execute: async (input) => {
      return { results: [`Result for ${input.query}`] };
    },
  },
];
