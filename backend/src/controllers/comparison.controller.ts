import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { ComparisonService } from "../services/comparison.service.js";

export class ComparisonController {
  constructor(
    private readonly comparisonService: ComparisonService
  ) {}



  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        sourceDocumentId,
        targetDocumentId,
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

      if (!sourceDocumentId) {
        return res.status(400).json({
          success: false,
          message:
            "Source document ID is required",
        });
      }

      if (!targetDocumentId) {
        return res.status(400).json({
          success: false,
          message:
            "Target document ID is required",
        });
      }

      if (
        sourceDocumentId ===
        targetDocumentId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Source and target documents must be different",
        });
      }

      const comparison =
        await this.comparisonService.compareDocuments(
          sourceDocumentId,
          targetDocumentId,
          userId
        );

      return res.status(201).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  };



  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
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

      const comparisons =
        await this.comparisonService.getComparisons(
          userId
        );

      return res.status(200).json({
        success: true,
        data: comparisons,
      });
    } catch (error) {
      next(error);
    }
  };



  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        comparisonId,
      } = req.params;

      const normalizedComparisonId =
        Array.isArray(comparisonId)
          ? comparisonId[0]
          : comparisonId;

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

      if (!normalizedComparisonId) {
        return res.status(400).json({
          success: false,
          message:
            "Comparison ID is required",
        });
      }

      const comparison =
        await this.comparisonService.getComparison(
          normalizedComparisonId,
          userId
        );

      return res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  };



  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        comparisonId,
      } = req.params;

      const normalizedComparisonId =
        Array.isArray(comparisonId)
          ? comparisonId[0]
          : comparisonId;

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

      if (!normalizedComparisonId) {
        return res.status(400).json({
          success: false,
          message:
            "Comparison ID is required",
        });
      }

      const result =
        await this.comparisonService.deleteComparison(
          normalizedComparisonId,
          userId
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