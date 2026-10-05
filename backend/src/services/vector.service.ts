import type { AIService } from "./ai.service.js";
import type { VectorRepository } from "../repositories/vector.repository.js";

export class VectorService {
  constructor(
    private readonly vectorRepository: VectorRepository,
    private readonly aiService: AIService
  ) {}

  
  
  

  async search(
    question: string,
    userId: string,
    documentId: string,
    limit = 5
  ) {
    const embedding =
      await this.aiService.generateEmbedding(
        question
      );

    return this.vectorRepository.searchSimilar(
      embedding,
      userId,
      documentId,
      limit
    );
  }

  
  
  

  async searchMultipleDocuments(
    question: string,
    userId: string,
    documentIds: string[],
    limitPerDocument = 5
  ) {
    if (documentIds.length === 0) {
      return [];
    }

    const embedding =
      await this.aiService.generateEmbedding(
        question
      );

    return this.vectorRepository.searchMultipleDocuments(
      embedding,
      userId,
      documentIds,
      limitPerDocument
    );
  }
}