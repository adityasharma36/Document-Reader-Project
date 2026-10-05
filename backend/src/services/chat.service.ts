import type { AIService } from "./ai.service.js";
import type { VectorService } from "./vector.service.js";
import type { QuoteService } from "./quote.service.js";
import type { ChatRepository } from "../repositories/chat.repository.js";

export class ChatService {
  constructor(
    private readonly aiService: AIService,
    private readonly vectorService: VectorService,
    private readonly quoteService: QuoteService,
    private readonly chatRepository: ChatRepository
  ) {}

  
  
  

  async getRelevantChunks(
    question: string,
    userId: string,
    documentId: string,
    limit = 5
  ) {
    return this.vectorService.search(
      question,
      userId,
      documentId,
      limit
    );
  }

  
  
  

  async getRelevantChunksFromMultipleDocuments(
    question: string,
    userId: string,
    documentIds: string[],
    limitPerDocument = 5
  ) {
    return this.vectorService.searchMultipleDocuments(
      question,
      userId,
      documentIds,
      limitPerDocument
    );
  }

  
  
  

  async getOrCreateSession(
    documentId: string,
    userId: string,
    sessionId?: string
  ) {
    if (sessionId) {
      const session =
        await this.chatRepository.findSession(
          sessionId,
          userId
        );

      if (!session) {
        throw new Error(
          "Chat session not found"
        );
      }

      await this.chatRepository.addDocumentToSession(
        sessionId,
        documentId
      );

      return session;
    }

    return this.chatRepository.createSession(
      documentId
    );
  }

  
  
  

  async saveUserMessage(
    sessionId: string,
    content: string
  ) {
    return this.chatRepository.createMessage({
      sessionId,
      role: "USER",
      content,
    });
  }

  
  
  

  async saveAnswerWithCitations(
    sessionId: string,
    documentId: string,
    userId: string,
    answer: string,
    quotes: string[]
  ) {
    const message =
      await this.chatRepository.createMessage({
        sessionId,
        role: "ASSISTANT",
        content: answer,
      });

    const verification =
      await this.quoteService.verifyQuotes(
        documentId,
        userId,
        quotes
      );

    const verifiedQuotes =
      verification.filter(
        (quote) => quote.verified
      );

    for (const quote of verifiedQuotes) {
      await this.chatRepository.createCitation({
        messageId: message.id,
        documentId,
        quote: quote.quote,
        verified: true,
        pageStart: quote.pageStart,
        pageEnd: quote.pageEnd,
        startOffset:
          quote.startOffset,
        endOffset:
          quote.endOffset,
      });
    }

    return {
      message,
      citations: verifiedQuotes,
    };
  }

  
  
  

  async extractQuotesFromAnswer(
    question: string,
    answer: string,
    context: Array<{
      content: string;
      startPage: number;
      endPage: number;
    }>
  ): Promise<string[]> {
    if (!answer.trim()) {
      return [];
    }

    if (context.length === 0) {
      return [];
    }

    const documentContext = context
      .map(
        (chunk, index) =>
          `
--- SOURCE ${index + 1} ---
Pages: ${chunk.startPage}-${chunk.endPage}

${chunk.content}
`
      )
      .join("\n");

    const prompt = `
You are a legal document citation extractor.

The user asked:

${question}

The AI generated this answer:

${answer}

Below is the actual document context:

${documentContext}

Extract exact quotes from the document that directly support the answer.

IMPORTANT:

1. Return only text that appears in the document.
2. Do not paraphrase.
3. Do not rewrite the quote.
4. Do not invent words.
5. Preserve the original wording.
6. Return only useful supporting quotes.
7. If there is no supporting quote, return an empty array.
8. Return valid JSON only.

Format:

{
  "quotes": [
    "exact quote 1",
    "exact quote 2"
  ]
}
`;

    try {
      const response =
        await this.aiService.generateResponse(
          prompt
        );

      const cleaned = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed =
        JSON.parse(cleaned);

      if (!Array.isArray(parsed.quotes)) {
        return [];
      }

      return parsed.quotes.filter(
        (quote: unknown): quote is string =>
          typeof quote === "string" &&
          quote.trim().length > 0
      );
    } catch {
      return [];
    }
  }

  
  
  

  async *streamAnswer(
    question: string,
    userId: string,
    documentId: string,
    signal?: AbortSignal
  ) {
    const chunks =
      await this.getRelevantChunks(
        question,
        userId,
        documentId,
        5
      );

    if (chunks.length === 0) {
      const answer =
        "I could not find relevant information in the document.";

      yield {
        type: "token" as const,
        content: answer,
      };

      return {
        answer,
        quotes: [],
        chunks: [],
      };
    }

    const context = chunks
      .map(
        (chunk, index) =>
          `
--- DOCUMENT CHUNK ${index + 1} ---
Pages: ${chunk.startPage}-${chunk.endPage}

${chunk.content}
`
      )
      .join("\n");

    const prompt = `
You are a legal contract analysis assistant.

Answer the user's question using ONLY the provided document context.

User question:

${question}

Document context:

${context}

Rules:

1. Use only information contained in the context.
2. Do not invent facts.
3. Do not make assumptions outside the document.
4. If the context does not contain enough information, say so.
5. Do not create fake quotations.
6. Keep the answer concise.
`;

    let answer = "";

    for await (const token of this.aiService.streamResponse(
      prompt,
      signal
    )) {
      if (signal?.aborted) {
        break;
      }

      answer += token;

      yield {
        type: "token" as const,
        content: token,
      };
    }

    return {
      answer,
      quotes: [],
      chunks,
    };
  }

  
  
  

  async askQuestion(
    question: string,
    userId: string,
    documentId: string,
    sessionId?: string
  ) {
    const session =
      await this.getOrCreateSession(
        documentId,
        userId,
        sessionId
      );

    await this.saveUserMessage(
      session.id,
      question
    );

    const chunks =
      await this.getRelevantChunks(
        question,
        userId,
        documentId,
        5
      );

    if (chunks.length === 0) {
      const answer =
        "I could not find relevant information in the document.";

      const saved = await this.saveAnswerWithCitations(
        session.id,
        documentId,
        userId,
        answer,
        []
      );

      return {
        ...saved,
        answer,
      };
    }

    const context = chunks
      .map(
        (chunk, index) =>
          `
--- DOCUMENT CHUNK ${index + 1} ---
Pages: ${chunk.startPage}-${chunk.endPage}

${chunk.content}
`
      )
      .join("\n");

    const prompt = `
You are a legal contract analysis assistant.

Answer the user's question using ONLY the document context.

Question:

${question}

Document context:

${context}

Return valid JSON only.

Format:

{
  "answer": "your answer",
  "quotes": [
    "exact quote from the document"
  ]
}

Rules:

1. Answer only from the document.
2. Never invent information.
3. Quotes must be exact text.
4. Do not paraphrase quotes.
5. If the answer cannot be found, say so.
6. If there is no supporting quote, return an empty quotes array.
`;

    const response =
      await this.aiService.generateResponse(
        prompt
      );

    const parsed =
      this.parseAIResponse(response);

    const saved = await this.saveAnswerWithCitations(
      session.id,
      documentId,
      userId,
      parsed.answer,
      parsed.quotes
    );

    return {
      ...saved,
      answer: parsed.answer,
    };
  }

  
  
  

  parseAIResponse(response: string): {
    answer: string;
    quotes: string[];
  } {
    try {
      const cleaned = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed =
        JSON.parse(cleaned);

      return {
        answer:
          typeof parsed.answer === "string"
            ? parsed.answer
            : "I could not determine an answer from the document.",

        quotes: Array.isArray(
          parsed.quotes
        )
          ? parsed.quotes.filter(
              (quote: unknown): quote is string =>
                typeof quote === "string" &&
                quote.trim().length > 0
            )
          : [],
      };
    } catch {
      return {
        answer: response,
        quotes: [],
      };
    }
  }

  
  
  

  async askMultipleDocuments(
    question: string,
    userId: string,
    documentIds: string[],
    sessionId?: string
  ) {
    if (documentIds.length < 2) {
      throw new Error(
        "At least two documents are required"
      );
    }

    let session;
    const firstDocumentId = documentIds[0];

    if (!firstDocumentId) {
      throw new Error(
        "At least one document is required"
      );
    }

    if (sessionId) {
      session =
        await this.chatRepository.findSession(
          sessionId,
          userId
        );

      if (!session) {
        throw new Error(
          "Chat session not found"
        );
      }

      for (const documentId of documentIds) {
        await this.chatRepository.addDocumentToSession(
          sessionId,
          documentId
        );
      }
    } else {
      session =
        await this.chatRepository.createSession(
          firstDocumentId
        );

      for (const documentId of documentIds.slice(
        1
      )) {
        await this.chatRepository.addDocumentToSession(
          session.id,
          documentId
        );
      }
    }

    await this.saveUserMessage(
      session.id,
      question
    );

    const chunks =
      await this.getRelevantChunksFromMultipleDocuments(
        question,
        userId,
        documentIds,
        5
      );

    if (chunks.length === 0) {
      const answer =
        "I could not find relevant information in the selected documents.";

      return this.chatRepository.createMessage({
        sessionId: session.id,
        role: "ASSISTANT",
        content: answer,
      });
    }

    const context = chunks
      .map(
        (chunk, index) =>
          `
--- DOCUMENT ${chunk.documentId} / CHUNK ${index + 1} ---
Pages: ${chunk.startPage}-${chunk.endPage}

${chunk.content}
`
      )
      .join("\n");

    const prompt = `
You are a legal contract comparison assistant.

Answer the user's question using ONLY the provided documents.

Question:

${question}

Documents:

${context}

Return valid JSON only.

Format:

{
  "answer": "comparison answer",
  "citations": [
    {
      "documentId": "document UUID",
      "quote": "exact quote"
    }
  ]
}

Rules:

1. Compare the documents where appropriate.
2. Do not invent information.
3. Every quote must be copied exactly from its document.
4. Never use a quote from one document as evidence for another document.
5. If information is unavailable, say so.
`;

    const response =
      await this.aiService.generateResponse(
        prompt
      );

    let parsed: {
      answer: string;
      citations: Array<{
        documentId: string;
        quote: string;
      }>;
    };

    try {
      const cleaned = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const json =
        JSON.parse(cleaned);

      parsed = {
        answer:
          typeof json.answer === "string"
            ? json.answer
            : "I could not determine an answer.",

        citations:
          Array.isArray(
            json.citations
          )
            ? json.citations.filter(
                (citation: any) =>
                  typeof citation.documentId ===
                    "string" &&
                  typeof citation.quote ===
                    "string"
              )
            : [],
      };
    } catch {
      parsed = {
        answer: response,
        citations: [],
      };
    }

    const message =
      await this.chatRepository.createMessage({
        sessionId: session.id,
        role: "ASSISTANT",
        content: parsed.answer,
      });

    const citationsByDocument =
      new Map<string, string[]>();

    for (const citation of parsed.citations) {
      const existing =
        citationsByDocument.get(
          citation.documentId
        ) ?? [];

      existing.push(citation.quote);

      citationsByDocument.set(
        citation.documentId,
        existing
      );
    }

    const quotesByDocument =
      Array.from(citationsByDocument.entries())
        .map(([documentId, quotes]) => ({
          documentId,
          quotes,
        }));

    const verifiedCitationGroups =
      await this.quoteService.verifyQuotesForDocuments(
        userId,
        quotesByDocument
      );

    const verifiedCitations =
      verifiedCitationGroups.flatMap(
        (group) =>
          group.citations.map((citation) => ({
            documentId: group.documentId,
            citation,
          }))
      );

    for (const verifiedCitation of verifiedCitations) {
      const citation = verifiedCitation.citation;

      if (!citation.verified) {
        continue;
      }

      await this.chatRepository.createCitation({
        messageId: message.id,
        documentId: verifiedCitation.documentId,
        quote: citation.quote,
        verified: true,
        pageStart: citation.pageStart,
        pageEnd: citation.pageEnd,
        startOffset: citation.startOffset,
        endOffset: citation.endOffset,
      });
    }

    return {
      message,
      citations:
        verifiedCitations
          .filter(({ citation }) => citation.verified)
          .map(({ documentId, citation }) => ({
            documentId,
            ...citation,
          })),
    };
  }

  
  
  

  async getHistory(
    sessionId: string,
    userId: string
  ) {
    return this.chatRepository.getHistory(
      sessionId,
      userId
    );
  }
}