import express from "express";

import { ComparisonController } from "../../controllers/comparison.controller.js";
import { ComparisonService } from "../../services/comparison.service.js";
import { ComparisonRepository } from "../../repositories/comparison.repository.js";
import { DocumentRepository } from "../../repositories/document.repository.js";
import { AIService } from "../../services/ai.service.js";
import { createAIProvider } from "../../providers/provider.factory.js";
import { resolveUser } from "../../middlewares/user.middleware.js";
import { validateBody } from "../../middlewares/request-validation.middleware.js";
import { comparisonBodySchema } from "../../validators/api.validator.js";

const comparisonRouter = express.Router();

const aiService = new AIService(
  createAIProvider()
);

const comparisonRepository =
  new ComparisonRepository();

const documentRepository =
  new DocumentRepository();

const comparisonService =
  new ComparisonService(
    aiService,
    comparisonRepository,
    documentRepository
  );

const comparisonController =
  new ComparisonController(
    comparisonService
  );



comparisonRouter.post(
  "/",
  resolveUser,
  validateBody(comparisonBodySchema),
  comparisonController.create
);



comparisonRouter.get(
  "/",
  resolveUser,
  comparisonController.getAll
);


comparisonRouter.get(
  "/:comparisonId",
  resolveUser,
  comparisonController.getById
);



comparisonRouter.delete(
  "/:comparisonId",
  resolveUser,
  comparisonController.delete
);

export default comparisonRouter;