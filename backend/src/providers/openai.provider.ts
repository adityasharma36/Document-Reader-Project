import OpenAI from "openai";
import type { IAIProvider } from "../interfaces/ai-provider.interface.js";
import { serverConfig } from "../configs/env.config.js";

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;

  constructor() {
    if (!serverConfig.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    this.client = new OpenAI({
      apiKey: serverConfig.OPENAI_API_KEY,
    });
  }

  async generateText(
    content: string,
    options: {
      model?: string;
      temperature?: number;
      systemInstruction?: string;
    } = {}
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model ?? "gpt-4o-mini",
      temperature: options.temperature ?? 0.7,
      messages: [
        {
          role: "system",
          content: options.systemInstruction ?? "",
        },
        {
          role: "user",
          content,
        },
      ],
    });

    const text = response.choices[0]?.message?.content;

    if (!text) {
      throw new Error("OpenAI returned empty response");
    }

    return text;
  }

  async generateEmbedding(
    content: string,
    model = "text-embedding-3-small"
  ): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model,
      input: content,
      dimensions: serverConfig.EMBEDDING_DIMENSION,
    });

    const vector = response.data[0]?.embedding;

    if (!vector?.length) {
      throw new Error("OpenAI embedding generation failed");
    }

    return vector;
  }

  async *streamText(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    if (signal?.aborted) {
      return;
    }

    const stream = await this.client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
      },
      { signal }
    );

    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }

      const text = chunk.choices[0]?.delta?.content;

      if (text) {
        yield text;
      }
    }
  }
}