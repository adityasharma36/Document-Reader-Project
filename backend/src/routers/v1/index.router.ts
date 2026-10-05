import express from "express";

import chatRouter from "./chat.router.js";
import documentRouter from "./document.router.js";
import citationRouter from "./citation.router.js";
import documentPageRouter from "./document-page.router.js";
import multiDocumentChatRouter from "./multi-document-chat.router.js";
import comparisonRouter from "./comparison.router.js";
import testRouter from "./test.router.js";
import agentRouter from "./agent.router.js";
const v1Router = express.Router();


v1Router.use(
  "/chat",
  chatRouter
);

v1Router.use(
  "/chat/multi",
  multiDocumentChatRouter
);



v1Router.use(
  "/documents",
  documentRouter
);

v1Router.use(
  "/documents",
  documentPageRouter
);



v1Router.use(
  "/citations",
  citationRouter
);



v1Router.use(
  "/comparisons",
  comparisonRouter
);



v1Router.use(
  "/test",
  testRouter
);
v1Router.use(
  "/agent",
  agentRouter
);

export default v1Router;