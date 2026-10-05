import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { ChatService } from "../services/chat.service.js";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

export class ChatController {
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
        documentId,
        question,
        sessionId,
      } = req.body;

      const userId = (
        req as AuthenticatedRequest
      ).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result =
        await this.chatService.askQuestion(
          question,
          userId,
          documentId,
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



  stream = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        documentId,
        question,
        sessionId,
      } = req.body;

      const userId = (
        req as AuthenticatedRequest
      ).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

     const session =
  await this.chatService.getOrCreateSession(
    documentId,
    userId,
    sessionId
  );
      await this.chatService.saveUserMessage(
        session.id,
        question
      );

      res.status(200);

      res.setHeader(
        "Content-Type",
        "text/event-stream"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      res.setHeader(
        "X-Accel-Buffering",
        "no"
      );

      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      const abortController =
        new AbortController();

      req.on("close", () => {
        abortController.abort();
      });

      const sendEvent = (
        type: string,
        data: unknown
      ) => {
        if (res.writableEnded) {
          return;
        }

        res.write(
          `event: ${type}\ndata: ${JSON.stringify(
            data
          )}\n\n`
        );
      };

      sendEvent("session", {
        sessionId: session.id,
      });

      let finalAnswer = "";

      let relevantChunks:
        {
          content: string;
          startPage: number;
          endPage: number;
        }[] = [];

      try {
        const stream =
          this.chatService.streamAnswer(
            question,
            userId,
            documentId,
            abortController.signal
          );

        while (true) {
          const result =
            await stream.next();

          if (result.done) {
            if (result.value) {
              finalAnswer =
                result.value.answer;

              relevantChunks =
                result.value.chunks;
            }

            break;
          }

          if (
            abortController.signal.aborted
          ) {
            break;
          }

          sendEvent("token", {
            content:
              result.value.content,
          });
        }


        let citations: unknown[] = [];

        if (finalAnswer.trim()) {
          const quotes =
            await this.chatService.extractQuotesFromAnswer(
              question,
              finalAnswer,
              relevantChunks
            );

          const saved =
            await this.chatService.saveAnswerWithCitations(
              session.id,
              documentId,
              userId,
              finalAnswer,
              quotes
            );

          citations =
            saved.citations;
        }

        sendEvent("done", {
          sessionId: session.id,
          content: finalAnswer,
          stopped:
            abortController.signal.aborted,
          citations,
        });

        if (!res.writableEnded) {
          res.end();
        }
      } catch (error) {
        if (
          abortController.signal.aborted
        ) {
          if (!res.writableEnded) {
            res.end();
          }

          return;
        }

        sendEvent("error", {
          message:
            error instanceof Error
              ? error.message
              : "Something went wrong",
        });

        if (!res.writableEnded) {
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  };



  history = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        sessionId,
      } = req.params;

      const normalizedSessionId =
        Array.isArray(sessionId)
          ? sessionId[0]
          : sessionId;

      const userId = (
        req as AuthenticatedRequest
      ).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const history =
        await this.chatService.getHistory(
          normalizedSessionId ?? "",
          userId
        );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}