import type { IAIProvider } from "../interfaces/ai-provider.interface.js";
import { serverConfig } from "../configs/env.config.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OpenAIProvider } from "./openai.provider.js";

export function createAIProvider(): IAIProvider {
  if (serverConfig.AI_PROVIDER.toLowerCase() === "gemini") {
    return new GeminiProvider();
  }

  return new OpenAIProvider();
}