import pino from "pino";
import { serverConfig } from "./env.config.js";

export const logger = pino({
  level: serverConfig.LOG_LEVEL,

  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: "info",
        options: {
          colorize: true,
        },
      },
      {
        target: "pino-roll",
        level: "info",
        options: {
          file: "./logs/app",
          frequency: "daily",
          mkdir: true,
          dateFormat: "yyyy-MM-dd",
        },
      },
    ],
  },
});