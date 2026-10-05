import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { CitationService } from "../services/citation.service.js";

export class CitationController {
  constructor(
    private readonly citationService: CitationService
  ) {}



  getCitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { citationId } = req.params;

      const normalizedCitationId =
        Array.isArray(citationId)
          ? citationId[0]
          : citationId;

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

      if (!normalizedCitationId) {
        return res.status(400).json({
          success: false,
          message: "Citation ID is required",
        });
      }

      const citation =
        await this.citationService.getCitation(
          normalizedCitationId,
          userId
        );

      if (!citation) {
        return res.status(404).json({
          success: false,
          message: "Citation not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: citation,
      });
    } catch (error) {
      next(error);
    }
  };
}