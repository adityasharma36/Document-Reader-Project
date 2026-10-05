import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { DocumentService } from "../services/document.service.js";

type AuthenticatedRequest = Request & {
  file?: {
    originalname: string;
    buffer: Buffer;
    size: number;
  };
  user?: {
    id: string;
  };
};

export class DocumentController {
  constructor(
    private readonly documentService: DocumentService
  ) {}

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = req as AuthenticatedRequest;
      const file = request.file;

      if (!file) {
        return res.status(400).json({
          message: "PDF file is required",
        });
      }

      const userId = (req as AuthenticatedRequest).user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const document =
        await this.documentService.uploadDocument(
          userId,
          file
        );

      return res.status(201).json({
        message: "PDF uploaded successfully",
        data: document,
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
      const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;

      if (!documentId) {
        return res.status(400).json({
          message: "Document id is required",
        });
      }

      const userId = (req as AuthenticatedRequest).user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const document =
        await this.documentService.getDocument(
          documentId,
          userId
        );

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      return res.status(200).json({
        data: document,
      });

    } catch (error) {
      next(error);
    }
  };

  getUserDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = req as AuthenticatedRequest;
      const userId = request.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const pagination = res.locals.pagination as {
        page: number;
        limit: number;
      };

      const result =
        await this.documentService.getUserDocuments(
          userId,
          pagination.page,
          pagination.limit
        );

      return res.status(200).json({
        data: result.documents,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
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
      const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;

      if (!documentId) {
        return res.status(400).json({
          message: "Document id is required",
        });
      }

      const userId = (req as AuthenticatedRequest).user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result =
        await this.documentService.deleteDocument(
          documentId,
          userId
        );

      return res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  };
}