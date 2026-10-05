import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { DocumentPageService } from "../services/document-page.service.js";

export class DocumentPageController {
  constructor(
    private readonly documentPageService: DocumentPageService
  ) {}


  getPage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        documentId,
        pageNumber,
      } = req.params;

      const normalizedDocumentId =
        Array.isArray(documentId)
          ? documentId[0]
          : documentId;

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

      if (!normalizedDocumentId) {
        return res.status(400).json({
          success: false,
          message: "Document ID is required",
        });
      }

      if (!pageNumber) {
        return res.status(400).json({
          success: false,
          message: "Page number is required",
        });
      }

      const page =
        Number(pageNumber);

      if (
        !Number.isInteger(page) ||
        page < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Page number must be a positive integer",
        });
      }

      const result =
        await this.documentPageService.getPage(
          normalizedDocumentId,
          page,
          userId
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


  getPages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        documentId,
      } = req.params;

      const normalizedDocumentId =
        Array.isArray(documentId)
          ? documentId[0]
          : documentId;

      const {
        startPage,
        endPage,
      } = req.query;

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

      if (!normalizedDocumentId) {
        return res.status(400).json({
          success: false,
          message: "Document ID is required",
        });
      }

      const start =
        Number(startPage);

      const end =
        Number(endPage);

      if (
        !Number.isInteger(start) ||
        start < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "startPage must be a positive integer",
        });
      }

      if (
        !Number.isInteger(end) ||
        end < start
      ) {
        return res.status(400).json({
          success: false,
          message:
            "endPage must be greater than or equal to startPage",
        });
      }

      const pages =
        await this.documentPageService.getPages(
          normalizedDocumentId,
          start,
          end,
          userId
        );

      return res.status(200).json({
        success: true,
        data: {
          documentId: normalizedDocumentId,
          startPage: start,
          endPage: end,
          pages,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}