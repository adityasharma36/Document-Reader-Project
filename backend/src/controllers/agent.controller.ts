import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AgentService } from "../services/agent.service.js";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

export class AgentController {
  constructor(
    private readonly agentService: AgentService
  ) {}

  research = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as AuthenticatedRequest).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });

        return;
      }

      const {
        documentId,
        question,
        sessionId,
      } = req.body;

      const result =
        await this.agentService.research(
          question,
          userId,
          documentId,
          sessionId
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}