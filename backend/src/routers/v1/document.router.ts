import express from "express";

import { DocumentController } from "../../controllers/document.controller.js";

import { DocumentService } from "../../services/document.service.js";
import { PdfService } from "../../services/pdf.service.js";
import { OCRService } from "../../services/ocr.service.js";
import { SupabaseService } from "../../services/supabase.service.js";

import { DocumentRepository } from "../../repositories/document.repository.js";
import { VectorRepository } from "../../repositories/vector.repository.js";

import { AIService } from "../../services/ai.service.js";
import { createAIProvider } from "../../providers/provider.factory.js";

import { upload } from "../../middlewares/upload.middleware.js";
import { resolveUser } from "../../middlewares/user.middleware.js";

import {
  validateParams,
  validateQuery,
} from "../../middlewares/request-validation.middleware.js";

import {
  documentIdParamsSchema,
  paginationQuerySchema,
} from "../../validators/api.validator.js";


const documentRouter =
  express.Router();




const aiService =
  new AIService(
    createAIProvider()
  );

const documentRepository =
  new DocumentRepository();

const vectorRepository =
  new VectorRepository();

const supabaseService =
  new SupabaseService();

const pdfService =
  new PdfService();

const ocrService =
  new OCRService();




const documentService =
  new DocumentService(
    documentRepository,
    vectorRepository,
    aiService,
    pdfService,
    ocrService,
    supabaseService
  );



const documentController =
  new DocumentController(
    documentService
  );




documentRouter.post(
  "/upload",

  resolveUser,

  upload.single("file"),

  documentController.upload
);



documentRouter.get(
  "/",

  resolveUser,

  validateQuery(
    paginationQuerySchema
  ),

  documentController.getUserDocuments
);



documentRouter.get(
  "/:documentId",

  resolveUser,

  validateParams(
    documentIdParamsSchema
  ),

  documentController.getById
);




documentRouter.delete(
  "/:documentId",

  resolveUser,

  validateParams(
    documentIdParamsSchema
  ),

  documentController.delete
);


export default documentRouter;