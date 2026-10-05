import { Prisma } from "../db/prisma/generated/client.js";
import { prisma } from "../db/prisma/client.js";

export class VectorRepository {


  async createChunk(data: {
    documentId: string;
    content: string;
    chunkIndex: number;
    startPage: number;
    endPage: number;
    startOffset: number;
    endOffset: number;
    embedding: number[];
  }) {
    const vector =
      `[${data.embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (
        "id",
        "documentId",
        "chunkIndex",
        "content",
        "normalizedContent",
        "startPage",
        "endPage",
        "startOffset",
        "endOffset",
        "embedding"
      )
      VALUES (
        gen_random_uuid(),
        ${data.documentId}::uuid,
        ${data.chunkIndex},
        ${data.content},
        ${data.content},
        ${data.startPage},
        ${data.endPage},
        ${data.startOffset},
        ${data.endOffset},
        ${vector}::vector
      )
    `;
  }

  

  async searchSimilar(
    embedding: number[],
    userId: string,
    documentId: string,
    limit = 5
  ) {
    const vector =
      `[${embedding.join(",")}]`;

    return prisma.$queryRaw<
      {
        id: string;
        documentId: string;
        content: string;
        chunkIndex: number;
        startPage: number;
        endPage: number;
        startOffset: number;
        endOffset: number;
        similarity: number;
      }[]
    >`
      SELECT
        dc."id",
        dc."documentId",
        dc."content",
        dc."chunkIndex",
        dc."startPage",
        dc."endPage",
        dc."startOffset",
        dc."endOffset",
        1 - (
          dc."embedding"
          <=> ${vector}::vector
        ) AS similarity

      FROM "DocumentChunk" dc

      INNER JOIN "Document" d
        ON d."id" = dc."documentId"

      WHERE
        d."id" = ${documentId}::uuid
        AND d."userId" = ${userId}
        AND d."status" = 'READY'
        AND dc."embedding" IS NOT NULL

      ORDER BY
        dc."embedding"
        <=> ${vector}::vector

      LIMIT ${limit}
    `;
  }



  async searchMultipleDocuments(
    embedding: number[],
    userId: string,
    documentIds: string[],
    limitPerDocument = 5
  ) {
    if (documentIds.length === 0) {
      return [];
    }

    const vector =
      `[${embedding.join(",")}]`;

    const documentIdList =
      Prisma.join(
        documentIds.map(
          (id) => Prisma.sql`${id}::uuid`
        )
      );

    return prisma.$queryRaw<
      {
        id: string;
        documentId: string;
        content: string;
        chunkIndex: number;
        startPage: number;
        endPage: number;
        startOffset: number;
        endOffset: number;
        similarity: number;
      }[]
    >`
      SELECT *
      FROM (
        SELECT
          dc."id",
          dc."documentId",
          dc."content",
          dc."chunkIndex",
          dc."startPage",
          dc."endPage",
          dc."startOffset",
          dc."endOffset",

          1 - (
            dc."embedding"
            <=> ${vector}::vector
          ) AS similarity,

          ROW_NUMBER() OVER (
            PARTITION BY dc."documentId"
            ORDER BY
              dc."embedding"
              <=> ${vector}::vector
          ) AS row_number

        FROM "DocumentChunk" dc

        INNER JOIN "Document" d
          ON d."id" = dc."documentId"

        WHERE
          d."id" IN (${documentIdList})
          AND d."userId" = ${userId}
          AND d."status" = 'READY'
          AND dc."embedding" IS NOT NULL
      ) ranked

      WHERE row_number <= ${limitPerDocument}

      ORDER BY similarity DESC
    `;
  }
}