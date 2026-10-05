import { prisma } from "../db/prisma/client.js";
import type { Prisma } from "../db/prisma/generated/client.js";

export class ChatRepository {


  async createSession(documentId: string) {
    return prisma.chatSession.create({
      data: {
        documents: {
          create: {
            documentId,
          },
        },
      },

      include: {
        documents: true,
      },
    });
  }



  async findSession(
    sessionId: string,
    userId: string
  ) {
    return prisma.chatSession.findFirst({
      where: {
        id: sessionId,

        documents: {
          some: {
            document: {
              userId,
            },
          },
        },
      },

      include: {
        documents: {
          include: {
            document: {
              select: {
                id: true,
                userId: true,
                filename: true,
                status: true,
              },
            },
          },
        },

        messages: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            citations: true,
          },
        },
      },
    });
  }

  async addDocumentToSession(
    sessionId: string,
    documentId: string
  ) {
    return prisma.chatSessionDocument.upsert({
      where: {
        sessionId_documentId: {
          sessionId,
          documentId,
        },
      },

      create: {
        sessionId,
        documentId,
      },

      update: {},
    });
  }

  async createMessage(data: {
    sessionId: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    agentSteps?: unknown;
  }) {
    return prisma.message.create({
      data: {
        sessionId: data.sessionId,

        role: data.role,

        content: data.content,

        ...(data.agentSteps !== undefined
          ? {
              agentSteps:
                data.agentSteps as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async createCitation(data: {
    messageId: string;
    documentId: string;
    quote: string;
    verified: boolean;
    pageStart: number;
    pageEnd: number;
    startOffset: number;
    endOffset: number;
  }) {
    return prisma.citation.create({
      data: {
        messageId: data.messageId,

        documentId:
          data.documentId,

        quote:
          data.quote,

        verified:
          data.verified,

        pageStart:
          data.pageStart,

        pageEnd:
          data.pageEnd,

        startOffset:
          data.startOffset,

        endOffset:
          data.endOffset,
      },
    });
  }

  async getHistory(
    sessionId: string,
    userId: string
  ) {
    const session =
      await prisma.chatSession.findFirst({
        where: {
          id: sessionId,

          documents: {
            some: {
              document: {
                userId,
              },
            },
          },
        },

        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },

            include: {
              citations: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

    return session?.messages ?? [];
  }
}