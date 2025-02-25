import { ChatOllama } from "@langchain/ollama";
import { createSupervisor } from "./index.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

console.log("Starting supervisor demo with Ollama...");

// Enable verbose logging
process.env.LANGCHAIN_VERBOSE = "true";

const model = new ChatOllama({
  model: "llama3.1", // Use one of your available models
  baseUrl: "http://localhost:11434", // default Ollama URL
  temperature: 0,
  verbose: true,
});

const add = tool(
    async (args) => {
      console.log(`Add: ${args.a} + ${args.b} = ${args.a + args.b}`);
      return args.a + args.b;
    },
    {
      name: "add",
      description: "Add two numbers",
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
    }
);

const multiply = tool(
    async (args) => {
      console.log(`Multiply: ${args.a} * ${args.b} = ${args.a * args.b}`);
      return args.a * args.b;
    },
    {
      name: "multiply",
      description: "Multiply two numbers",
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
    }
);

const webSearch = tool(
    async (args) => {
      console.log(`Search: "${args.query}"`);
      return "Facebook: 67,317, Apple: 164,000, Amazon: 1,551,000, Netflix: 14,000, Google: 181,269";
    },
    {
      name: "web_search",
      description: "Search the web",
      schema: z.object({ query: z.string() })
    }
);

const mathAgent = createReactAgent({
  llm: model,
  tools: [add, multiply],
  name: "math_expert",
  prompt: "You are a math expert.",
//   verbose: true,
});

const researchAgent = createReactAgent({
  llm: model,
  tools: [webSearch],
  name: "research_expert",
  prompt: "You are a researcher with web search.",
//   verbose: true,
});

console.log("Creating and running supervisor...");
const workflow = createSupervisor({
  agents: [researchAgent, mathAgent],
  llm: model,
  prompt: "You manage a research expert and math expert. For facts, use research_agent. For calculations, use math_agent.",
//   verbose: true,
});

const app = workflow.compile();
const result = await app.invoke({
  messages: [
    {
      role: "user",
      content: "what's the combined headcount of the FAANG companies in 2024??"
    }
  ]
});

console.log("\n=== RESULT ===");
console.log(JSON.stringify(result, null, 2));






