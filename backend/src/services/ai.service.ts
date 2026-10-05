import type { IAIProvider } from "../interfaces/ai-provider.interface.js";

export class AIService {
  constructor(
    private readonly provider: IAIProvider
  ) {}

  async generateResponse(
    prompt: string
  ): Promise<string> {
    return this.provider.generateText(prompt);
  }

  async generateEmbedding(
    content: string
  ): Promise<number[]> {
    return this.provider.generateEmbedding(content);
  }

  streamResponse(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    return this.provider.streamText(
      prompt,
      signal
    );
  }
}