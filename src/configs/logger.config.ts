import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

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