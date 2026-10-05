import type { DocumentPageRepository } from "../repositories/document-page.repository.js";

export class DocumentPageService {
  constructor(
    private readonly documentPageRepository: DocumentPageRepository
  ) {}

  async getPage(
    documentId: string,
    pageNumber: number,
    userId: string
  ) {
    return this.documentPageRepository.findPage(
      documentId,
      pageNumber,
      userId
    );
  }

  async getPages(
    documentId: string,
    startPage: number,
    endPage: number,
    userId: string
  ) {
    return this.documentPageRepository.findPages(
      documentId,
      startPage,
      endPage,
      userId
    );
  }
}