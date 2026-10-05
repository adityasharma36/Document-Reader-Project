import fs from "node:fs/promises";

import {
  createWorker,
  type Worker,
} from "tesseract.js";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  createCanvas,
} from "@napi-rs/canvas";

export interface OCRPage {
  pageNumber: number;
  text: string;
}

export class OCRService {
  private worker: Worker | null = null;

  private async getWorker() {
    if (this.worker) {
      return this.worker;
    }

    this.worker =
      await createWorker("eng");

    return this.worker;
  }

  async processPdf(
    filePath: string
  ): Promise<OCRPage[]> {
    const fileBuffer =
      await fs.readFile(filePath);

    const loadingTask =
      pdfjsLib.getDocument({
        data: new Uint8Array(fileBuffer),
      });

    const pdf =
      await loadingTask.promise;

    const worker =
      await this.getWorker();

    const pages: OCRPage[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(pageNumber);

      const viewport =
        page.getViewport({
          scale: 1.5,
        });

      const canvas =
        createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height)
        );

      const context =
        canvas.getContext("2d");

      await page.render({
        canvasContext: context as any,
        canvas: canvas as unknown as HTMLCanvasElement,
        viewport,
      }).promise;

      const imageBuffer =
        canvas.toBuffer("image/png");

      const result =
        await worker.recognize(
          imageBuffer
        );

      const text =
        result.data.text
          .replace(/\s+/g, " ")
          .trim();

      pages.push({
        pageNumber,
        text,
      });
    }

    return pages;
  }

  hasReadableText(
    pages: OCRPage[]
  ): boolean {
    return pages.some(
      (page) =>
        page.text.trim().length > 0
    );
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}