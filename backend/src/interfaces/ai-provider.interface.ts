export interface IAIProvider {
  generateText(prompt: string): Promise<string>;

  generateEmbedding(
    content: string
  ): Promise<number[]>;

  streamText(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<string>;
}