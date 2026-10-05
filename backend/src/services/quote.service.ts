import { prisma } from "../db/prisma/client.js";

interface NormalizedTextResult {
  text: string;
  originalIndexes: number[];
}

export interface VerifiedQuote {
  quote: string;
  verified: boolean;
  pageStart: number;
  pageEnd: number;
  startOffset: number;
  endOffset: number;
}

export class QuoteService {
  private normalizeWithMapping(text: string): NormalizedTextResult {
    let normalized = "";
    const originalIndexes: number[] = [];

    let lastWasSpace = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i] ?? "";

      if (/\s/.test(char)) {
        if (!lastWasSpace) {
          normalized += " ";
          originalIndexes.push(i);
          lastWasSpace = true;
        }

        continue;
      }

      normalized += char.toLowerCase();
      originalIndexes.push(i);
      lastWasSpace = false;
    }

    return {
      text: normalized.trim(),
      originalIndexes,
    };
  }

  private findAllOccurrences(
    text: string,
    search: string
  ): number[] {
    const positions: number[] = [];

    if (!search) {
      return positions;
    }

    let start = 0;

    while (true) {
      const index = text.indexOf(search, start);

      if (index === -1) {
        break;
      }

      positions.push(index);

      
      
      start = index + 1;
    }

    return positions;
  }

  private getPageForOffset(
    pages: {
      pageNumber: number;
      startOffset: number;
      endOffset: number;
    }[],
    offset: number
  ) {
    return pages.find(
      (page) =>
        offset >= page.startOffset &&
        offset <= page.endOffset
    );
  }

  private selectBestOccurrence(
    occurrences: {
      pageStart: number;
      pageEnd: number;
      startOffset: number;
      endOffset: number;
    }[]
  ) {
    if (occurrences.length === 0) {
      return null;
    }

    












    return [...occurrences].sort((a, b) => {
      const aPageSpan = a.pageEnd - a.pageStart;
      const bPageSpan = b.pageEnd - b.pageStart;

      if (aPageSpan !== bPageSpan) {
        return aPageSpan - bPageSpan;
      }

      return a.startOffset - b.startOffset;
    })[0];
  }

  async verifyQuote(
    documentId: string,
    userId: string,
    quote: string
  ): Promise<VerifiedQuote | null> {
    if (!quote.trim()) {
      return null;
    }

    const pages = await prisma.documentPage.findMany({
      where: {
        documentId,
        document: {
          userId,
        },
      },
      orderBy: {
        pageNumber: "asc",
      },
      select: {
        pageNumber: true,
        text: true,
        startOffset: true,
        endOffset: true,
      },
    });

    if (pages.length === 0) {
      return null;
    }

    










    const documentText = pages
      .map((page) => page.text)
      .join("\n");

    const normalizedDocument =
      this.normalizeWithMapping(documentText);

    const normalizedQuote =
      this.normalizeWithMapping(quote).text;

    if (!normalizedQuote) {
      return null;
    }

    


    const occurrences = this.findAllOccurrences(
      normalizedDocument.text,
      normalizedQuote
    );

    if (occurrences.length === 0) {
      return null;
    }

    const candidates: {
      pageStart: number;
      pageEnd: number;
      startOffset: number;
      endOffset: number;
    }[] = [];

    for (const occurrence of occurrences) {
      const normalizedStart = occurrence;
      const normalizedEnd =
        occurrence + normalizedQuote.length - 1;

      const originalStartIndex =
        normalizedDocument.originalIndexes[normalizedStart];

      const originalEndIndex =
        normalizedDocument.originalIndexes[normalizedEnd];

      if (
        originalStartIndex === undefined ||
        originalEndIndex === undefined
      ) {
        continue;
      }

      


      let currentDocumentOffset = 0;

      let startOffset = -1;
      let endOffset = -1;

      for (const page of pages) {
        const pageStart = currentDocumentOffset;
        const pageEnd =
          currentDocumentOffset + page.text.length;

        if (
          originalStartIndex >= pageStart &&
          originalStartIndex <= pageEnd
        ) {
          startOffset =
            page.startOffset +
            (originalStartIndex - pageStart);
        }

        if (
          originalEndIndex >= pageStart &&
          originalEndIndex <= pageEnd
        ) {
          endOffset =
            page.startOffset +
            (originalEndIndex - pageStart) +
            1;
        }

        currentDocumentOffset =
          pageEnd + 1;
      }

      if (startOffset === -1 || endOffset === -1) {
        continue;
      }

      const affectedPages = pages.filter((page) => {
        return (
          page.endOffset >= startOffset &&
          page.startOffset <= endOffset
        );
      });

      if (affectedPages.length === 0) {
        continue;
      }

      const firstAffectedPage = affectedPages[0];
      const lastAffectedPage =
        affectedPages[affectedPages.length - 1];

      if (!firstAffectedPage || !lastAffectedPage) {
        continue;
      }

      candidates.push({
        pageStart: firstAffectedPage.pageNumber,
        pageEnd: lastAffectedPage.pageNumber,
        startOffset,
        endOffset,
      });
    }

    const bestOccurrence =
      this.selectBestOccurrence(candidates);

    if (!bestOccurrence) {
      return null;
    }

    return {
      quote,
      verified: true,
      pageStart: bestOccurrence.pageStart,
      pageEnd: bestOccurrence.pageEnd,
      startOffset: bestOccurrence.startOffset,
      endOffset: bestOccurrence.endOffset,
    };
  }

  async verifyQuotes(
    documentId: string,
    userId: string,
    quotes: string[]
  ): Promise<VerifiedQuote[]> {
    const verifiedQuotes: VerifiedQuote[] = [];

    for (const quote of quotes) {
      const verified = await this.verifyQuote(
        documentId,
        userId,
        quote
      );

      if (verified) {
        verifiedQuotes.push(verified);
      }
    }

    return verifiedQuotes;
  }

  async verifyQuotesForDocuments(
    userId: string,
    documentQuotes: {
      documentId: string;
      quotes: string[];
    }[]
  ): Promise<
    {
      documentId: string;
      citations: VerifiedQuote[];
    }[]
  > {
    const results = [];

    for (const document of documentQuotes) {
      const citations = await this.verifyQuotes(
        document.documentId,
        userId,
        document.quotes
      );

      results.push({
        documentId: document.documentId,
        citations,
      });
    }

    return results;
  }

  async getVerifiedQuote(
    citationId: string,
    userId: string
  ) {
    return prisma.citation.findFirst({
      where: {
        id: citationId,
        verified: true,
        document: {
          userId,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
          },
        },
        message: {
          select: {
            id: true,
            sessionId: true,
          },
        },
      },
    });
  }
}