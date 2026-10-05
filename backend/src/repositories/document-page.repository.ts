import { prisma } from "../db/prisma/client.js";

export class DocumentPageRepository {
  async findPage(
    documentId: string,
    pageNumber: number,
    userId: string
  ) {
    return prisma.documentPage.findFirst({
      where: {
        documentId,
        pageNumber,
        document: {
          userId,
        },
      },
    });
  }

  async findPages(
    documentId: string,
    startPage: number,
    endPage: number,
    userId: string
  ) {
    return prisma.documentPage.findMany({
      where: {
        documentId,
        pageNumber: {
          gte: startPage,
          lte: endPage,
        },
        document: {
          userId,
        },
      },
      orderBy: {
        pageNumber: "asc",
      },
    });
  }
}