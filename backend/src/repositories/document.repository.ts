import { prisma } from "../db/prisma/client.js";

export type DocumentStatus =
  | "UPLOADING"
  | "PARSING"
  | "OCR_PROCESSING"
  | "INDEXING"
  | "READY"
  | "FAILED"
  | "EMPTY_SCANNED_ERROR";

export class DocumentRepository {
  async createDocument(data: {
    userId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }) {
    return prisma.document.create({
      data: {
        userId: data.userId,
        filename: data.fileName,
        fileKey: data.filePath,
        sizeBytes: data.fileSize,
        mimeType: data.mimeType,
        status: "UPLOADING",
      },
    });
  }

  async createPage(data: {
    documentId: string;
    pageNumber: number;
    text: string;
    startOffset: number;
    endOffset: number;
  }) {
    return prisma.documentPage.create({
      data: {
        documentId: data.documentId,
        pageNumber: data.pageNumber,
        text: data.text,
        startOffset: data.startOffset,
        endOffset: data.endOffset,
      },
    });
  }

  async update(
    documentId: string,
    userId: string,
    data: {
      pageCount?: number;

      status?: DocumentStatus;

      statusMessage?: string | null;

      rawText?: string | null;

      normalizedText?: string | null;

      hasOcr?: boolean;
    }
  ) {
    return prisma.document.updateMany({
      where: {
        id: documentId,
        userId,
      },
      data,
    });
  }

  async markFailed(
    documentId: string,
    userId: string,
    message: string
  ) {
    return prisma.document.updateMany({
      where: {
        id: documentId,
        userId,
      },
      data: {
        status: "FAILED",
        statusMessage: message,
      },
    });
  }

  async markEmptyScanned(
    documentId: string,
    userId: string,
    message: string
  ) {
    return prisma.document.updateMany({
      where: {
        id: documentId,
        userId,
      },
      data: {
        status: "EMPTY_SCANNED_ERROR",
        statusMessage: message,
      },
    });
  }

  async findById(
    documentId: string,
    userId: string
  ) {
    return prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
      include: {
        pages: {
          orderBy: {
            pageNumber: "asc",
          },
        },

        chunks: {
          orderBy: {
            chunkIndex: "asc",
          },
        },
      },
    });
  }

  async delete(
    documentId: string,
    userId: string
  ) {
    return prisma.document.deleteMany({
      where: {
        id: documentId,
        userId,
      },
    });
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;

    const [documents, total] =
      await Promise.all([
        prisma.document.findMany({
          where: {
            userId,
          },

          skip,

          take: limit,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
            pageCount: true,
            status: true,
            statusMessage: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        prisma.document.count({
          where: {
            userId,
          },
        }),
      ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(
        total / limit
      ),
    };
  }
}