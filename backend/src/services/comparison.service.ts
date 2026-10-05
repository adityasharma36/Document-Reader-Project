import type { AIService } from "./ai.service.js";
import type { ComparisonRepository } from "../repositories/comparison.repository.js";
import type { DocumentRepository } from "../repositories/document.repository.js";

export class ComparisonService {
  constructor(
    private readonly aiService: AIService,
    private readonly comparisonRepository: ComparisonRepository,
    private readonly documentRepository: DocumentRepository
  ) {}

  async compareDocuments(
    sourceDocumentId: string,
    targetDocumentId: string,
    userId: string
  ) {
    if (sourceDocumentId === targetDocumentId) {
      throw new Error(
        "Source and target documents must be different"
      );
    }

    const existing =
      await this.comparisonRepository.findExisting(
        sourceDocumentId,
        targetDocumentId,
        userId
      );

    if (existing) {
      return existing;
    }

    const sourceDocument =
      await this.documentRepository.findById(
        sourceDocumentId,
        userId
      );

    const targetDocument =
      await this.documentRepository.findById(
        targetDocumentId,
        userId
      );

    if (!sourceDocument) {
      throw new Error("Source document not found");
    }

    if (!targetDocument) {
      throw new Error("Target document not found");
    }

    if (sourceDocument.status !== "READY") {
      throw new Error(
        "Source document is not ready for comparison"
      );
    }

    if (targetDocument.status !== "READY") {
      throw new Error(
        "Target document is not ready for comparison"
      );
    }

    const sourceChunks = sourceDocument.chunks;
    const targetChunks = targetDocument.chunks;

    if (
      sourceChunks.length === 0 ||
      targetChunks.length === 0
    ) {
      throw new Error(
        "Both documents must contain readable text"
      );
    }

    const batchSize = 10;

    const changes: Array<{
      section: string | null;
      oldText: string | null;
      newText: string | null;
      changeType:
        | "ADDED"
        | "REMOVED"
        | "MODIFIED";
      significance:
        | "LOW"
        | "MEDIUM"
        | "HIGH";
      summary: string;
    }> = [];

    const totalBatches = Math.max(
      Math.ceil(sourceChunks.length / batchSize),
      Math.ceil(targetChunks.length / batchSize)
    );

    for (
      let batchIndex = 0;
      batchIndex < totalBatches;
      batchIndex++
    ) {
      const sourceBatch = sourceChunks.slice(
        batchIndex * batchSize,
        (batchIndex + 1) * batchSize
      );

      const targetBatch = targetChunks.slice(
        batchIndex * batchSize,
        (batchIndex + 1) * batchSize
      );

      const sourceText = sourceBatch
        .map(
          (chunk) =>
            `[Chunk ${chunk.chunkIndex} | Pages ${chunk.startPage}-${chunk.endPage}]\n${chunk.content}`
        )
        .join("\n\n");

      const targetText = targetBatch
        .map(
          (chunk) =>
            `[Chunk ${chunk.chunkIndex} | Pages ${chunk.startPage}-${chunk.endPage}]\n${chunk.content}`
        )
        .join("\n\n");

      const prompt = `
You are a legal contract comparison assistant.

Compare the following source and target contract sections.

SOURCE CONTRACT:
${sourceText}

TARGET CONTRACT:
${targetText}

Identify only substantive differences.

For every difference return:

- section
- oldText
- newText
- changeType
- significance
- summary

changeType must be one of:
ADDED
REMOVED
MODIFIED

significance must be one of:
LOW
MEDIUM
HIGH

Rules:

1. Do not invent text.
2. oldText must come exactly from SOURCE CONTRACT.
3. newText must come exactly from TARGET CONTRACT.
4. Ignore formatting-only differences.
5. Focus on legally meaningful changes.
6. Consider changes to:
   - obligations
   - rights
   - payment
   - termination
   - liability
   - indemnification
   - confidentiality
   - intellectual property
   - warranties
   - governing law
   - dispute resolution
   - deadlines
   - penalties
7. Return valid JSON only.

Format:

{
  "changes": [
    {
      "section": "string",
      "oldText": "string or null",
      "newText": "string or null",
      "changeType": "ADDED | REMOVED | MODIFIED",
      "significance": "LOW | MEDIUM | HIGH",
      "summary": "string"
    }
  ]
}
`;

      const response =
        await this.aiService.generateResponse(prompt);

      const parsed =
        this.parseComparisonResponse(response);

      changes.push(...parsed);
    }

    const verifiedChanges =
      this.removeDuplicateChanges(changes);

    const sortedChanges =
      this.sortBySignificance(verifiedChanges);

    const summary =
      await this.generateSummary(sortedChanges);

    const comparison =
      await this.comparisonRepository.createComparison({
        sourceDocumentId,
        targetDocumentId,
        summary,
      });

    for (const change of sortedChanges) {
      await this.comparisonRepository.createChange({
        comparisonId: comparison.id,
        section: change.section,
        oldText: change.oldText,
        newText: change.newText,
        changeType: change.changeType,
        significance: change.significance,
        summary: change.summary,
      });
    }

    return this.comparisonRepository.findById(
      comparison.id,
      userId
    );
  }

  private parseComparisonResponse(
    response: string
  ) {
    try {
      const cleaned = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed.changes)) {
        return [];
      }

      return parsed.changes
        .filter((change: any) => {
          return (
            typeof change.summary === "string" &&
            ["ADDED", "REMOVED", "MODIFIED"].includes(
              change.changeType
            ) &&
            ["LOW", "MEDIUM", "HIGH"].includes(
              change.significance
            )
          );
        })
        .map((change: any) => ({
          section:
            typeof change.section === "string"
              ? change.section
              : null,

          oldText:
            typeof change.oldText === "string"
              ? change.oldText
              : null,

          newText:
            typeof change.newText === "string"
              ? change.newText
              : null,

          changeType: change.changeType,

          significance: change.significance,

          summary: change.summary,
        }));
    } catch {
      return [];
    }
  }

  private removeDuplicateChanges(
    changes: Array<{
      section: string | null;
      oldText: string | null;
      newText: string | null;
      changeType:
        | "ADDED"
        | "REMOVED"
        | "MODIFIED";
      significance:
        | "LOW"
        | "MEDIUM"
        | "HIGH";
      summary: string;
    }>
  ) {
    const seen = new Set<string>();

    return changes.filter((change) => {
      const key = [
        change.changeType,
        change.oldText,
        change.newText,
        change.summary,
      ]
        .join("|")
        .toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  }

  private sortBySignificance(
    changes: Array<{
      section: string | null;
      oldText: string | null;
      newText: string | null;
      changeType:
        | "ADDED"
        | "REMOVED"
        | "MODIFIED";
      significance:
        | "LOW"
        | "MEDIUM"
        | "HIGH";
      summary: string;
    }>
  ) {
    const priority = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...changes].sort(
      (a, b) =>
        priority[b.significance] -
        priority[a.significance]
    );
  }

  private async generateSummary(
    changes: Array<{
      section: string | null;
      oldText: string | null;
      newText: string | null;
      changeType:
        | "ADDED"
        | "REMOVED"
        | "MODIFIED";
      significance:
        | "LOW"
        | "MEDIUM"
        | "HIGH";
      summary: string;
    }>
  ) {
    if (changes.length === 0) {
      return "No substantive differences were identified between the documents.";
    }

    const changeSummary = changes
      .slice(0, 30)
      .map(
        (change) =>
          `- [${change.significance}] ${change.summary}`
      )
      .join("\n");

    const prompt = `
Summarize the substantive legal differences between two contracts.

Differences:

${changeSummary}

Provide a concise summary focusing on the most important legal changes.

Do not invent information.
`;

    return this.aiService.generateResponse(prompt);
  }

  async getComparison(
    comparisonId: string,
    userId: string
  ) {
    const comparison =
      await this.comparisonRepository.findById(
        comparisonId,
        userId
      );

    if (!comparison) {
      throw new Error("Comparison not found");
    }

    return comparison;
  }

  async getComparisons(userId: string) {
    return this.comparisonRepository.findByUser(
      userId
    );
  }

  async deleteComparison(
    comparisonId: string,
    userId: string
  ) {
    const result =
      await this.comparisonRepository.deleteComparison(
        comparisonId,
        userId
      );

    if (result.count === 0) {
      throw new Error("Comparison not found");
    }

    return {
      success: true,
    };
  }
}