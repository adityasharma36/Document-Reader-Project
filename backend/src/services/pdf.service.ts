import fs from "node:fs/promises";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedPdf {
  pages: ExtractedPage[];
  pageCount: number;
}

export class PdfService {
  async extractPages(
    filePath: string
  ): Promise<ExtractedPdf> {
    const fileBuffer =
      await fs.readFile(filePath);

    const loadingTask =
      pdfjsLib.getDocument({
        data: new Uint8Array(fileBuffer),
      });

    const pdf =
      await loadingTask.promise;

    const pages: ExtractedPage[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(pageNumber);

      const textContent =
        await page.getTextContent();

      const text = textContent.items
        .map((item) => {
          if (
            "str" in item &&
            typeof item.str === "string"
          ) {
            return item.str;
          }

          return "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push({
        pageNumber,
        text,
      });
    }

    return {
      pages,
      pageCount: pdf.numPages,
    };
  }

  hasReadableText(
    pages: ExtractedPage[]
  ): boolean {
    return pages.some(
      (page) =>
        page.text.trim().length > 0
    );
  }

  createChunks(
    pages: ExtractedPage[],
    chunkSize = 1200,
    overlap = 200
  ) {
    const chunks: {
      content: string;
      startPage: number;
      endPage: number;
      startOffset: number;
      endOffset: number;
    }[] = [];

    let fullText = "";
    const pageRanges: {
      pageNumber: number;
      start: number;
      end: number;
    }[] = [];

    for (const page of pages) {
      const start = fullText.length;

      fullText += page.text;

      const end = fullText.length;

      pageRanges.push({
        pageNumber: page.pageNumber,
        start,
        end,
      });

      fullText += "\n";
    }

    let startOffset = 0;
    let chunkIndex = 0;

    while (
      startOffset < fullText.length
    ) {
      const endOffset = Math.min(
        startOffset + chunkSize,
        fullText.length
      );

      const content = fullText
        .slice(startOffset, endOffset)
        .trim();

      if (content.length > 0) {
        const affectedPages =
          pageRanges.filter(
            (page) =>
              page.end >= startOffset &&
              page.start <= endOffset
          );

        chunks.push({
          content,
          startPage:
            affectedPages[0]?.pageNumber ?? 1,
          endPage:
            affectedPages[
              affectedPages.length - 1
            ]?.pageNumber ?? 1,
          startOffset,
          endOffset,
        });
      }

      chunkIndex++;

      if (
        endOffset >= fullText.length
      ) {
        break;
      }

      startOffset =
        endOffset - overlap;
    }

    return chunks;
  }
}