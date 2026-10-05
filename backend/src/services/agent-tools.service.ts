import { prisma } from "../db/prisma/client.js";

import type { VectorService } from "./vector.service.js";

export class AgentToolsService {
  constructor(
    private readonly vectorService: VectorService
  ) {}

  async searchDocument(
    query: string,
    userId: string,
    documentId: string
  ) {
    if (!query.trim()) {
      return {
        success: false,
        error: "Search query cannot be empty.",
      };
    }

    const results =
      await this.vectorService.search(
        query,
        userId,
        documentId,
        5
      );

    return {
      success: true,
      tool: "search_document",
      results: results.map((result) => ({
        chunkId: result.id,
        content: result.content,
        startPage: result.startPage,
        endPage: result.endPage,
        startOffset: result.startOffset,
        endOffset: result.endOffset,
      })),
    };
  }

  async getSection(
    pageNumber: number,
    userId: string,
    documentId: string
  ) {
    if (!Number.isInteger(pageNumber)) {
      return {
        success: false,
        error: "pageNumber must be an integer.",
      };
    }

    if (pageNumber < 1) {
      return {
        success: false,
        error: "pageNumber must be greater than 0.",
      };
    }

    const page =
      await prisma.documentPage.findFirst({
        where: {
          documentId,
          pageNumber,
          document: {
            userId,
          },
        },
        select: {
          id: true,
          pageNumber: true,
          text: true,
          startOffset: true,
          endOffset: true,
        },
      });

    if (!page) {
      return {
        success: false,
        error: `Page ${pageNumber} was not found.`,
      };
    }

    return {
      success: true,
      tool: "get_section",
      section: page,
    };
  }

  async listClauses(
    userId: string,
    documentId: string
  ) {
    const document =
      await prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
        },
        select: {
          id: true,
          filename: true,
          status: true,
        },
      });

    if (!document) {
      return {
        success: false,
        error: "Document not found.",
      };
    }

    const clauses =
      await prisma.documentChunk.findMany({
        where: {
          documentId,
          document: {
            userId,
          },
        },
        orderBy: {
          chunkIndex: "asc",
        },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          startPage: true,
          endPage: true,
          startOffset: true,
          endOffset: true,
          clauseType: true,
        },
      });

    return {
      success: true,
      tool: "list_clauses",
      clauses,
    };
  }
}