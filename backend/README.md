# Legal Contract Analysis Platform

An AI-powered legal contract analysis platform that allows users to upload contracts, ask questions about documents, receive verified answers with exact citations, compare contracts, and perform agentic document research.

The backend is built with **Node.js, TypeScript, Express, PostgreSQL, Prisma, pgvector, Supabase, and Google Gemini**.

---

## 🚀 Features

### 📄 Document Management

* Upload PDF documents
* Validate uploaded file types
* Store document metadata in PostgreSQL
* Store uploaded files using Supabase Storage
* Extract text from PDF documents
* Detect scanned/image-based PDFs
* OCR fallback using Tesseract
* Track document processing status
* Support large documents
* Document library with pagination
* Delete documents

### 🔎 Document Processing

Documents go through the following pipeline:

```text
Upload
   ↓
PARSING
   ↓
Text Extraction
   ↓
Readable Text?
 ┌───────────────┐
 │               │
YES              NO
 │               │
 ↓               ↓
Indexing      OCR_PROCESSING
 │               │
 │          OCR Text Found?
 │          ┌────┴────┐
 │         YES        NO
 │          │          │
 └──────────┘          ↓
      ↓          EMPTY_SCANNED_ERROR
   INDEXING
      ↓
    READY
```

If processing fails unexpectedly, the document is retained with:

```text
FAILED
```

along with a useful status message.

---

## 💬 AI Document Chat

Users can ask questions about a contract.

The system:

1. Generates an embedding for the question.
2. Searches relevant document chunks using pgvector.
3. Sends relevant context to Gemini.
4. Generates an answer.
5. Extracts exact supporting quotes.
6. Verifies every quote against the original document.
7. Stores verified citations with the answer.

### Streaming

Chat responses can be streamed using Server-Sent Events (SSE).

The system also supports stopping generation while preserving generated content.

---

## ✅ Verified Citations

Citation verification is one of the most important parts of the application.

The system does **not blindly trust AI-generated page numbers or offsets**.

Instead:

```text
AI Answer
   ↓
Extract Quotes
   ↓
Search Original Document
   ↓
Normalize Whitespace
   ↓
Find Exact Occurrence
   ↓
Determine Page + Offset
   ↓
Verified Citation
```

The verifier handles:

* whitespace differences
* multi-page quotes
* duplicate quote occurrences
* page boundaries
* original document offsets

Only verified quotes are stored as citations.

If a quote cannot be found in the original document, it is not treated as verified evidence.

---

## 🧠 Vector Search

Large documents are split into smaller chunks.

Each chunk contains:

* document ID
* chunk index
* content
* start page
* end page
* start offset
* end offset
* embedding

Embeddings are stored using PostgreSQL's `pgvector`.

Example flow:

```text
Question
   ↓
Gemini Embedding
   ↓
pgvector Similarity Search
   ↓
Top Relevant Chunks
   ↓
Gemini
   ↓
Answer + Quotes
```

---

## 📚 Large Document Support

The platform is designed to handle large contracts, including documents with many pages.

Documents are:

* split into chunks
* embedded individually
* searched semantically
* processed in batches for comparison

The system avoids sending an entire large document to the AI model at once.

---

## 📑 Document Comparison

Users can compare two documents.

The comparison system:

1. Loads both documents.
2. Processes chunks in batches.
3. Sends corresponding content to Gemini.
4. Detects:

   * added clauses
   * removed clauses
   * modified clauses
5. Assigns significance:

   * LOW
   * MEDIUM
   * HIGH
6. Sorts important changes first.
7. Stores the comparison and individual changes.

Example:

```text
Contract A
     │
     ├── Clause 1
     ├── Clause 2
     └── Clause 3
           │
           ▼
        Compare
           ▲
           │
     ┌─────┴─────┐
Contract B
```

---

# 🤖 Agentic Document Research

The project implements an agentic document research workflow.

The agent can perform multiple research rounds using tools.

### Available tools

#### `search_document`

Performs semantic search over the document.

```json
{
  "query": "What are the termination rights?"
}
```

#### `get_section`

Retrieves an exact document page.

```json
{
  "pageNumber": 9
}
```

#### `list_clauses`

Lists indexed document chunks/clauses.

```json
{}
```

### Agent Loop

```text
User Question
      ↓
    Agent
      ↓
Choose Tool
      ↓
Execute Tool
      ↓
Observation
      ↓
Agent
      ↓
Choose Next Tool
      ↓
...
      ↓
Final Answer
```

The agent has a hard limit of **5 research rounds** to prevent uncontrolled tool execution.

Agent steps are stored with the assistant message using the `agentSteps` field.

---

# 🏗️ Architecture

```text
Client
  │
  ▼
Express API
  │
  ├── Document Routes
  ├── Chat Routes
  ├── Comparison Routes
  ├── Citation Routes
  └── Agent Routes
        │
        ▼
     Services
        │
        ├── DocumentService
        ├── ChatService
        ├── AIService
        ├── VectorService
        ├── QuoteService
        ├── ComparisonService
        ├── AgentService
        ├── OCRService
        └── PDFService
        │
        ▼
   Repositories
        │
        ▼
   PostgreSQL
        │
        └── pgvector

External Services:

Supabase Storage
       │
       ▼
Uploaded Documents

Google Gemini
       │
       ├── Text Generation
       └── Embeddings
```

---

# 📁 Project Structure

```text
server/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── agent.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── comparison.controller.ts
│   │   └── document.controller.ts
│   │
│   ├── db/
│   │   └── prisma/
│   │       └── client.ts
│   │
│   ├── interfaces/
│   │   └── ai-provider.interface.ts
│   │
│   ├── middlewares/
│   │   ├── rate-limit.middleware.ts
│   │   ├── request-validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── user.middleware.ts
│   │
│   ├── providers/
│   │   ├── gemini.provider.ts
│   │   └── provider.factory.ts
│   │
│   ├── repositories/
│   │   ├── chat.repository.ts
│   │   ├── comparison.repository.ts
│   │   ├── document.repository.ts
│   │   └── vector.repository.ts
│   │
│   ├── routes/
│   │   ├── agent.router.ts
│   │   ├── chat.router.ts
│   │   ├── comparison.router.ts
│   │   ├── document.router.ts
│   │   └── v1.router.ts
│   │
│   ├── services/
│   │   ├── agent.service.ts
│   │   ├── agent-tools.service.ts
│   │   ├── ai.service.ts
│   │   ├── chat.service.ts
│   │   ├── comparison.service.ts
│   │   ├── document.service.ts
│   │   ├── ocr.service.ts
│   │   ├── pdf.service.ts
│   │   ├── quote.service.ts
│   │   ├── supabase.service.ts
│   │   └── vector.service.ts
│   │
│   ├── utils/
│   │   ├── errors/
│   │   └── quote/
│   │
│   ├── validators/
│   │   └── api.validator.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 🛠️ Tech Stack

| Technology    | Purpose                |
| ------------- | ---------------------- |
| Node.js       | Runtime                |
| TypeScript    | Type safety            |
| Express       | REST API               |
| PostgreSQL    | Primary database       |
| Prisma        | ORM                    |
| pgvector      | Semantic vector search |
| Google Gemini | LLM + embeddings       |
| Supabase      | File storage           |
| Tesseract.js  | OCR                    |
| PDF.js        | PDF text extraction    |
| Zod           | Request validation     |
| SSE           | Streaming responses    |

---

# ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

PORT=5000
```

Never commit real API keys or secrets to GitHub.

Use `.env.example` for sharing the required variable names.

---

# 🚀 Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Move into the backend:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Add your environment variables.

---

# 🗄️ Database Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Make sure PostgreSQL has the `pgvector` extension enabled.

For example:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

# ▶️ Run the Server

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Start production server:

```bash
npm start
```

---

# 🔌 Main API Endpoints

## Documents

```http
POST /api/v1/documents
GET /api/v1/documents
GET /api/v1/documents/:documentId
DELETE /api/v1/documents/:documentId
```

## Chat

```http
POST /api/v1/chat
POST /api/v1/chat/stream
GET /api/v1/chat/:sessionId/history
```

## Multi-document Chat

```http
POST /api/v1/chat/multi
```

## Citations

```http
GET /api/v1/citations/:citationId
```

## Comparisons

```http
POST /api/v1/comparisons
GET /api/v1/comparisons
GET /api/v1/comparisons/:comparisonId
DELETE /api/v1/comparisons/:comparisonId
```

## Agentic Research

```http
POST /api/v1/agent/research
```

Example:

```json
{
  "documentId": "document-uuid",
  "question": "What are the termination rights of the parties?"
}
```

---

# 🔐 Security Considerations

The application includes:

* request validation using Zod
* user ownership checks
* document ownership checks
* citation ownership checks
* rate limiting
* controlled agent tool execution
* maximum agent research rounds
* environment-based API keys
* no committed secrets

All document-related queries are scoped to the authenticated/resolved user.

---

# 🧪 Testing Strategy

Important test cases include:

### Documents

* valid PDF upload
* unsupported file type
* empty PDF
* scanned PDF
* OCR failure
* large document
* processing failure

### Chat

* relevant question
* irrelevant question
* streaming response
* stopping generation
* chat history
* unauthorized session

### Citation Verification

* exact quote
* whitespace differences
* multi-page quote
* duplicate quote
* nonexistent quote

### Comparison

* identical documents
* added clause
* removed clause
* modified clause
* large documents

### Agent

* tool selection
* malformed tool response
* unknown tool
* maximum round limit
* final answer without sufficient evidence

---

# 📌 Design Decisions

## Why pgvector?

Legal documents can be large, so sending the entire document to an LLM for every question is inefficient.

Semantic search allows the system to retrieve only relevant portions of the document.

## Why verify AI quotes?

An LLM can generate plausible but inaccurate citations.

Therefore, the application independently searches the original document and verifies that every displayed citation actually exists.

## Why OCR?

Many legal documents are scanned PDFs containing images instead of text.

OCR allows the application to extract text from these documents instead of immediately treating them as empty.

## Why an agentic workflow?

Some research questions require multiple steps.

For example:

```text
Search for termination clause
        ↓
Find relevant page
        ↓
Read exact section
        ↓
Analyze the clause
        ↓
Answer
```

The agent can dynamically choose the next tool instead of following a fixed sequence.

---

# 📈 Future Improvements

Possible future improvements include:

* clause-level alignment for document comparison
* stronger citation anchoring for duplicate passages
* OCR support for additional languages
* hybrid keyword + vector search
* background job queue for document processing
* Redis caching
* authentication with OAuth/JWT
* advanced document highlighting
* multi-document citation comparison
* automated evaluation datasets
* comprehensive integration and end-to-end tests

---

# 👨‍💻 Development

The backend follows a layered architecture:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Database
```

External providers are abstracted through services/interfaces so that the AI provider can be replaced without changing the rest of the application.

---

# 📄 License

This project was created as part of a backend engineering assignment and is intended for evaluation and demonstration purposes.
