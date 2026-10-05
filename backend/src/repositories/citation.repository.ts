import { prisma } from "../db/prisma/client.js";

export class CitationRepository {
  async findById(
    citationId: string,
    userId: string
  ) {
    return prisma.citation.findFirst({
      where: {
        id: citationId,
        document: {
          userId,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
          },
        },
        message: {
          select: {
            id: true,
            sessionId: true,
          },
        },
      },
    });
  }
}