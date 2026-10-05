import express from "express";

import { AgentController } from "../../controllers/agent.controller.js";
import { AgentService } from "../../services/agent.service.js";
import { AgentToolsService } from "../../services/agent-tools.service.js";

import { AIService } from "../../services/ai.service.js";
import { VectorService } from "../../services/vector.service.js";

import { VectorRepository } from "../../repositories/vector.repository.js";
import { ChatRepository } from "../../repositories/chat.repository.js";

import { createAIProvider } from "../../providers/provider.factory.js";

import { resolveUser } from "../../middlewares/user.middleware.js";
import { validateBody } from "../../middlewares/request-validation.middleware.js";

import {
  agentResearchBodySchema,
} from "../../validators/api.validator.js";

const agentRouter =
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

const agentTools =
  new AgentToolsService(
    vectorService
  );

const agentService =
  new AgentService(
    aiService,
    agentTools,
    chatRepository
  );

const agentController =
  new AgentController(
    agentService
  );

agentRouter.post(
  "/research",
  resolveUser,
  validateBody(
    agentResearchBodySchema
  ),
  agentController.research
);

export default agentRouter;