import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { ChatService } from "../services/chat.service.js";

export class MultiDocumentChatController {
  constructor(
    private readonly chatService: ChatService
  ) {}


  ask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        documentIds,
        sessionId,
        question,
      } = req.body;

      const userId =
        (
          req as Request & {
            user?: {
              id: string;
            };
          }
        ).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (
        !Array.isArray(documentIds) ||
        documentIds.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least 2 documents are required",
        });
      }

      if (documentIds.length > 10) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 10 documents are allowed",
        });
      }

      if (
        typeof question !== "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required",
        });
      }

      const result =
        await this.chatService.askMultipleDocuments(
          question,
          userId,
          documentIds,
          sessionId
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}