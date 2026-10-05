import express from "express";

import { DocumentPageController } from "../../controllers/document-page.controller.js";
import { DocumentPageService } from "../../services/document-page.service.js";
import { DocumentPageRepository } from "../../repositories/document-page.repository.js";

import { resolveUser } from "../../middlewares/user.middleware.js";

const documentPageRouter =
  express.Router();

const documentPageRepository =
  new DocumentPageRepository();

const documentPageService =
  new DocumentPageService(
    documentPageRepository
  );

const documentPageController =
  new DocumentPageController(
    documentPageService
  );


documentPageRouter.get(
  "/:documentId/pages/:pageNumber",
  resolveUser,
  documentPageController.getPage
);



documentPageRouter.get(
  "/:documentId/pages",
  resolveUser,
  documentPageController.getPages
);

export default documentPageRouter;