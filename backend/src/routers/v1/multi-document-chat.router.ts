import express from "express";

import { MultiDocumentChatController } from "../../controllers/multi-document-chat.controller.js";
import { ChatService } from "../../services/chat.service.js";
import { VectorService } from "../../services/vector.service.js";
import { VectorRepository } from "../../repositories/vector.repository.js";
import { ChatRepository } from "../../repositories/chat.repository.js";
import { AIService } from "../../services/ai.service.js";
import { QuoteService } from "../../services/quote.service.js";
import { createAIProvider } from "../../providers/provider.factory.js";

import { resolveUser } from "../../middlewares/user.middleware.js";
import { chatRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validateBody } from "../../middlewares/request-validation.middleware.js";

import {
  multiDocumentChatBodySchema,
} from "../../validators/api.validator.js";

const multiDocumentChatRouter =
  express.Router();


const aiService =
  new AIService(
    createAIProvider()
  );

const vectorRepository =
  new VectorRepository();

const vectorService =
  new VectorService(
    vectorRepository,
    aiService
  );

const chatRepository =
  new ChatRepository();

const quoteService =
  new QuoteService();

const chatService =
  new ChatService(
    aiService,
    vectorService,
    quoteService,
    chatRepository
  );

const multiDocumentChatController =
  new MultiDocumentChatController(
    chatService
  );



multiDocumentChatRouter.post(
  "/",
  resolveUser,
  chatRateLimiter,
  validateBody(
    multiDocumentChatBodySchema
  ),
  multiDocumentChatController.ask
);

export default multiDocumentChatRouter;