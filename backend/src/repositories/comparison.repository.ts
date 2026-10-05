import { prisma } from "../db/prisma/client.js";

export class ComparisonRepository {


  async createComparison(data: {
    sourceDocumentId: string;
    targetDocumentId: string;
    summary: string;
  }) {
    return prisma.documentComparison.create({
      data: {
        sourceDocumentId: data.sourceDocumentId,
        targetDocumentId: data.targetDocumentId,
        summary: data.summary,
      },
    });
  }



  async createChange(data: {
    comparisonId: string;
    section?: string | null;
    oldText?: string | null;
    newText?: string | null;
    changeType:
      | "ADDED"
      | "REMOVED"
      | "MODIFIED";
    significance:
      | "LOW"
      | "MEDIUM"
      | "HIGH";
    summary: string;
  }) {
    return prisma.comparisonChange.create({
      data: {
        comparisonId: data.comparisonId,

        section:
          data.section ?? null,

        oldText:
          data.oldText ?? null,

        newText:
          data.newText ?? null,

        changeType:
          data.changeType,

        significance:
          data.significance,

        summary:
          data.summary,
      },
    });
  }


  async findById(
    comparisonId: string,
    userId: string
  ) {
    return prisma.documentComparison.findFirst({
      where: {
        id: comparisonId,

        sourceDocument: {
          userId,
        },

        targetDocument: {
          userId,
        },
      },

      include: {
        sourceDocument: {
          select: {
            id: true,
            filename: true,
          },
        },

        targetDocument: {
          select: {
            id: true,
            filename: true,
          },
        },

        differences: {
          orderBy: {
            significance: "desc",
          },
        },
      },
    });
  }


  async findExisting(
    sourceDocumentId: string,
    targetDocumentId: string,
    userId: string
  ) {
    return prisma.documentComparison.findFirst({
      where: {
        sourceDocumentId,
        targetDocumentId,

        sourceDocument: {
          userId,
        },

        targetDocument: {
          userId,
        },
      },

      include: {
        differences: {
          orderBy: {
            significance: "desc",
          },
        },
      },
    });
  }


  async findByUser(userId: string) {
    return prisma.documentComparison.findMany({
      where: {
        sourceDocument: {
          userId,
        },

        targetDocument: {
          userId,
        },
      },

      include: {
        sourceDocument: {
          select: {
            id: true,
            filename: true,
          },
        },

        targetDocument: {
          select: {
            id: true,
            filename: true,
          },
        },

        differences: {
          orderBy: {
            significance: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }



  async deleteComparison(
    comparisonId: string,
    userId: string
  ) {
    return prisma.documentComparison.deleteMany({
      where: {
        id: comparisonId,

        sourceDocument: {
          userId,
        },

        targetDocument: {
          userId,
        },
      },
    });
  }
}