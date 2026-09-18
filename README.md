# SetupTemplate

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Zod-Validation-3A7CA5?logo=zod&logoColor=white" alt="Zod" />
</p>

A clean and lightweight Express + TypeScript starter template for building REST APIs with structured routing, request validation, logging, and centralized error handling.

## Overview

This project provides a production-friendly base for new backend services with:

- Express server setup
- Versioned routing structure
- Zod-based request validation
- Centralized API error responses
- Structured logging with Pino
- Daily log file rotation
- TypeScript configuration ready for Node.js projects

## Tech Stack

- Node.js
- TypeScript
- Express
- Zod
- Pino + Pino Pretty
- Pino Roll
- dotenv

## Project Structure

```bash
setupTemplate/
├── logs/
├── src/
│   ├── app.ts
│   ├── configs/
│   │   ├── logger.config.ts
│   │   └── server.config.ts
│   ├── middlewares/
│   │   └── error.middleware.ts
│   ├── routers/
│   │   ├── v1/
│   │   │   ├── index.router.ts
│   │   │   └── test.router.ts
│   │   └── v2/
│   ├── utils/
│   │   └── Errors/
│   │       └── app.error.ts
│   └── validators/
│       ├── index.ts
│       └── test.validator.ts
├── .env
├── package.json
├── tsconfig.json
├── README.md
└── dist/
```

## Features

### 1. Express App Bootstrapping
The application is created in [src/app.ts](src/app.ts) and includes:

- JSON body parsing with a 1 MB limit
- Request logging with `pino-http`
- Global error middleware
- Versioned route registration at `/api/v1`

### 2. Configuration Management
The config layer handles environment-based setup:

- Port configuration from `PORT` environment variable
- Default fallback: `3000`
- Logging level from `LOG_LEVEL` with fallback: `info`

See:
- [src/configs/server.config.ts](src/configs/server.config.ts)
- [src/configs/logger.config.ts](src/configs/logger.config.ts)

### 3. Routing
The router structure is designed for versioning and modular growth.

- V1 index router mounts the route group
- Current route: `/api/v1`
- Test route: `/api/v1/`

See:
- [src/routers/v1/index.router.ts](src/routers/v1/index.router.ts)
- [src/routers/v1/test.router.ts](src/routers/v1/test.router.ts)

### 4. Validation with Zod
Request validation is implemented with Zod.

Current validation schema:

```ts
export const testSchema = z.object({
  name: z.string("must be more than 6 char")
})
```

This means the request body must include a `name` field as a string.

See:
- [src/validators/test.validator.ts](src/validators/test.validator.ts)
- [src/validators/index.ts](src/validators/index.ts)

### 5. Error Handling
A centralized error handling middleware returns a structured JSON error response.

Current behavior:

```json
{
  "success": false,
  "message": "..."
}
```

Custom error classes are defined in:
- [src/utils/Errors/app.error.ts](src/utils/Errors/app.error.ts)

Available classes:
- `InternalError`
- `BadRequestError`
- `NotFoundError`
- `UnauthorizedError`

### 6. Logging
The app uses Pino for structured logging and pretty console output.

Also configured to write logs to a daily rotating file under the `logs` directory.

Example configuration:

```ts
transport: {
  targets: [
    {
      target: "pino-pretty",
      ...
    },
    {
      target: "pino-roll",
      file: "./logs/app",
      frequency: "daily",
      mkdir: true,
      dateFormat: "yyyy-MM-dd"
    }
  ]
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
LOG_LEVEL=info
```

## Installation

```bash
npm install
```

## Run the Project

### Development mode

```bash
npm run dev
```

This command compiles TypeScript in watch mode and runs the app using `nodemon`.

## Scripts

In [package.json](package.json), the project includes:

```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "npx tsc --watch & nodemon dist/app.js"
  }
}
```

## API Endpoint

### GET /api/v1/

This endpoint validates the incoming request body and responds with:

```json
{
  "success": true
}
```

### Example Request

```bash
curl -X GET http://localhost:3000/api/v1/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'
```

Response:

```json
{
  "success": true
}
```

### Invalid Request Example

```bash
curl -X GET http://localhost:3000/api/v1/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:

```json
{
  "message": "Invalid request body",
  "success": false,
  "error": {}
}
```

## Middleware Flow

The application startup flow is:

1. Parse JSON request body
2. Attach request logging
3. Run route handlers
4. Catch and respond with error middleware

The main app boot sequence lives in [src/app.ts](src/app.ts).

## Notes

- The app uses ES modules (`"type": "module"` in package.json).
- TypeScript is configured with NodeNext module resolution.
- The output directory for compiled files is `dist`.
- `logs/app` is used for daily log rotation.

## Best Practices for Extending This Template

- Add new routes inside a versioned folder such as `src/routers/v1/` or `src/routers/v2/`
- Keep validation logic in `src/validators/`
- Centralize custom response logic in middleware or service layers
- Use the error classes in `src/utils/Errors/app.error.ts` for consistent API responses
- Keep environment variables in `.env` and never hardcode secrets

## License

This project is licensed under ISC.

---

If you want, this template can also be upgraded with:

- JWT authentication
- Prisma or database integration
- Swagger documentation
- Docker setup
- CI/CD pipeline configuration
