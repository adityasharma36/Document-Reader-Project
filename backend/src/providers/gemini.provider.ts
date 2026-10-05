import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAIProvider } from "../interfaces/ai-provider.interface.js";
import { serverConfig } from "../configs/env.config.js";

export class GeminiProvider implements IAIProvider {

  private readonly client: GoogleGenerativeAI;

  constructor() {
    if (!serverConfig.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    this.client = new GoogleGenerativeAI(
      serverConfig.GEMINI_API_KEY
    );
  }

  async generateText(
    prompt: string
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return text;
  }

  async generateEmbedding(
    content: string
  ): Promise<number[]> {
    const model = this.client.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    const result = await model.embedContent({
      content: {
        role: "user",
        parts: [{ text: content }],
      },
      outputDimensionality:
        serverConfig.EMBEDDING_DIMENSION,
    } as Parameters<typeof model.embedContent>[0]);
    const embedding = result.embedding.values;

    if (
      !embedding?.length ||
      embedding.length !== serverConfig.EMBEDDING_DIMENSION
    ) {
      throw new Error("Gemini embedding generation failed");
    }

    return embedding;
  }

  async *streamText(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    if (signal?.aborted) {
      return;
    }

    const model = this.client.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      if (signal?.aborted) {
        break;
      }

      const text = chunk.text();

      if (text) {
        yield text;
      }
    }
  }
}