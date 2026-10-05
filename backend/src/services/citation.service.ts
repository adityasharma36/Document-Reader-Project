import type { CitationRepository } from "../repositories/citation.repository.js";

export class CitationService {
  constructor(
    private readonly citationRepository: CitationRepository
  ) {}

  async getCitation(
    citationId: string,
    userId: string
  ) {
    return this.citationRepository.findById(
      citationId,
      userId
    );
  }
}