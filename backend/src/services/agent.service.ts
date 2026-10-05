import type { AIService } from "./ai.service.js";
import type { AgentToolsService } from "./agent-tools.service.js";
import type { ChatRepository } from "../repositories/chat.repository.js";

interface AgentStep {
  round: number;
  action:
    | "tool"
    | "final"
    | "error";

  tool?: string;

  arguments?: Record<string, unknown>;

  observation?: unknown;

  answer?: string;

  error?: string;
}

interface AgentResult {
  answer: string;
  steps: AgentStep[];
}

const MAX_ROUNDS = 5;

export class AgentService {
  constructor(
    private readonly aiService: AIService,
    private readonly agentTools: AgentToolsService,
    private readonly chatRepository: ChatRepository
  ) {}

  async research(
    question: string,
    userId: string,
    documentId: string,
    sessionId?: string
  ): Promise<AgentResult & { sessionId: string }> {
   

    let session;

    if (sessionId) {
      session =
        await this.chatRepository.findSession(
          sessionId,
          userId
        );

      if (!session) {
        throw new Error(
          "Chat session not found."
        );
      }

      await this.chatRepository.addDocumentToSession(
        session.id,
        documentId
      );
    } else {
      session =
        await this.chatRepository.createSession(
          documentId
        );
    }

 

    await this.chatRepository.createMessage({
      sessionId: session.id,
      role: "USER",
      content: question,
    });

    






    const steps: AgentStep[] = [];

    let context = "";

    for (
      let round = 1;
      round <= MAX_ROUNDS;
      round++
    ) {
      const prompt =
        this.buildAgentPrompt(
          question,
          context,
          round
        );

      let response: string;

      try {
        response =
          await this.aiService.generateResponse(
            prompt
          );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "AI request failed.";

        steps.push({
          round,
          action: "error",
          error: message,
        });

        throw error;
      }

      const decision =
        this.parseAgentResponse(
          response
        );

      





      if (!decision) {
        steps.push({
          round,
          action: "error",
          error:
            "AI returned malformed agent response.",
        });

        context +=
          "\nSYSTEM: Your previous response was invalid. Return valid JSON only.";

        continue;
      }

      





      if (decision.action === "final") {
        const answer =
          decision.answer?.trim();

        if (!answer) {
          steps.push({
            round,
            action: "error",
            error:
              "AI returned an empty final answer.",
          });

          context +=
            "\nSYSTEM: Final answer cannot be empty.";

          continue;
        }

        steps.push({
          round,
          action: "final",
          answer,
        });

        await this.chatRepository.createMessage({
          sessionId: session.id,
          role: "ASSISTANT",
          content: answer,
          agentSteps: steps,
        });

        return {
          answer,
          steps,
          sessionId: session.id,
        };
      }

      





      const tool =
        decision.tool;

      const args =
        decision.arguments ?? {};

      let observation: unknown;

      try {
        observation =
          await this.executeTool(
            tool,
            args,
            userId,
            documentId
          );
      } catch (error) {
        observation = {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Tool execution failed.",
        };
      }

      steps.push({
        round,
        action: "tool",
        tool,
        arguments: args,
        observation,
      });

      context +=
        `\nROUND ${round}\n` +
        `TOOL: ${tool}\n` +
        `ARGUMENTS: ${JSON.stringify(args)}\n` +
        `OBSERVATION: ${JSON.stringify(observation)}\n`;
    }

    





    const fallback =
      "I could not complete the document research within the allowed research rounds.";

    steps.push({
      round: MAX_ROUNDS,
      action: "final",
      answer: fallback,
    });

    await this.chatRepository.createMessage({
      sessionId: session.id,
      role: "ASSISTANT",
      content: fallback,
      agentSteps: steps,
    });

    return {
      answer: fallback,
      steps,
      sessionId: session.id,
    };
  }

  private async executeTool(
    tool: string,
    args: Record<string, unknown>,
    userId: string,
    documentId: string
  ) {
    switch (tool) {
      case "search_document": {
        const query =
          typeof args.query === "string"
            ? args.query
            : "";

        return this.agentTools.searchDocument(
          query,
          userId,
          documentId
        );
      }

      case "get_section": {
        const pageNumber =
          Number(args.pageNumber);

        return this.agentTools.getSection(
          pageNumber,
          userId,
          documentId
        );
      }

      case "list_clauses": {
        return this.agentTools.listClauses(
          userId,
          documentId
        );
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${tool}`,
        };
    }
  }

  private parseAgentResponse(
    response: string
  ):
    | {
        action: "tool";
        tool: string;
        arguments: Record<
          string,
          unknown
        >;
      }
    | {
        action: "final";
        answer: string;
      }
    | null {
    try {
      let cleaned =
        response.trim();

      if (
        cleaned.startsWith("```")
      ) {
        cleaned =
          cleaned
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
      }

      const parsed =
        JSON.parse(cleaned);

      if (
        parsed?.action === "final" &&
        typeof parsed.answer ===
          "string"
      ) {
        return {
          action: "final",
          answer: parsed.answer,
        };
      }

      if (
        parsed?.action === "tool" &&
        typeof parsed.tool ===
          "string"
      ) {
        return {
          action: "tool",
          tool: parsed.tool,
          arguments:
            parsed.arguments &&
            typeof parsed.arguments ===
              "object"
              ? parsed.arguments
              : {},
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private buildAgentPrompt(
    question: string,
    context: string,
    round: number
  ) {
    return `
You are an agentic legal document research assistant.

You MUST research the provided document using the available tools.

USER QUESTION:
${question}

AVAILABLE TOOLS:

1. search_document
Purpose:
Search the document for semantically relevant content.

Arguments:
{
  "query": "string"
}

2. get_section
Purpose:
Read an exact page/section after search results identify a relevant page.

Arguments:
{
  "pageNumber": number
}

3. list_clauses
Purpose:
List the indexed clauses/chunks of the document.

Arguments:
{}

RULES:

- You have a maximum of ${MAX_ROUNDS} research rounds.
- Use tools when you need more information.
- Do not invent document facts.
- If the available evidence does not support the answer, say that clearly.
- Prefer search_document first for unknown information.
- Use get_section when you need exact page content.
- Use list_clauses when you need an overview of the document structure.
- Do not call unknown tools.
- Return JSON only.
- Do not use Markdown code fences.

For a tool call return:

{
  "action": "tool",
  "tool": "search_document",
  "arguments": {
    "query": "..."
  }
}

For get_section:

{
  "action": "tool",
  "tool": "get_section",
  "arguments": {
    "pageNumber": 4
  }
}

For list_clauses:

{
  "action": "tool",
  "tool": "list_clauses",
  "arguments": {}
}

When you have enough evidence, return:

{
  "action": "final",
  "answer": "..."
}

CURRENT ROUND:
${round}

PREVIOUS TOOL OBSERVATIONS:
${context || "No tools have been called yet."}
`;
  }
}