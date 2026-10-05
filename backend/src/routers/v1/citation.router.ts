import express from "express";

import { CitationController } from "../../controllers/citation.controller.js";
import { CitationService } from "../../services/citation.service.js";
import { CitationRepository } from "../../repositories/citation.repository.js";

import { resolveUser } from "../../middlewares/user.middleware.js";

const citationRouter =
  express.Router();

const citationRepository =
  new CitationRepository();

const citationService =
  new CitationService(
    citationRepository
  );

const citationController =
  new CitationController(
    citationService
  );



citationRouter.get(
  "/:citationId",
  resolveUser,
  citationController.getCitation
);

export default citationRouter;