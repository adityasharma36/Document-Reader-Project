import { z } from "zod";

export const chatBodySchema = z.object({
  documentId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  question: z.string().trim().min(1).max(2000),
});

export const multiDocumentChatBodySchema = z.object({
  documentIds: z.array(z.string().uuid()).min(2).max(10),
  sessionId: z.string().uuid().optional(),
  question: z.string().trim().min(1).max(2000),
});

export const documentIdParamsSchema = z.object({
  documentId: z.string().uuid(),
});

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const citationIdParamsSchema = z.object({
  citationId: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const comparisonBodySchema = z
  .object({
    sourceDocumentId: z.string().uuid(),
    targetDocumentId: z.string().uuid(),
  })
  .refine(
    (data) =>
      data.sourceDocumentId !==
      data.targetDocumentId,
    {
      message:
        "Source and target documents must be different",
      path: ["targetDocumentId"],
    }
  );

export type PaginationQuery =
  z.infer<typeof paginationQuerySchema>;
  export const agentResearchBodySchema = z.object({
  documentId: z.string().uuid(),

  question: z
    .string()
    .trim()
    .min(1)
    .max(5000),

  sessionId: z
    .string()
    .uuid()
    .optional(),
});