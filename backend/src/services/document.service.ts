import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { DocumentRepository } from "../repositories/document.repository.js";
import type { VectorRepository } from "../repositories/vector.repository.js";
import type { AIService } from "./ai.service.js";
import type { PdfService } from "./pdf.service.js";
import type { OCRService } from "./ocr.service.js";
import type { SupabaseService } from "./supabase.service.js";

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly vectorRepository: VectorRepository,
    private readonly aiService: AIService,
    private readonly pdfService: PdfService,
    private readonly ocrService: OCRService,
    private readonly supabaseService: SupabaseService
  ) {}

  async uploadDocument(
    userId: string,
    file: {
      originalname: string;
      mimetype?: string;
      buffer: Buffer;
      size: number;
    }
  ) {
    const fileKey =
      `documents/${userId}/${Date.now()}-${file.originalname}`;
    const temporaryDirectory =
      await fs.mkdtemp(
        path.join(os.tmpdir(), "document-reader-")
      );
    const temporaryPath =
      path.join(temporaryDirectory, file.originalname);
    const contentType =
      file.mimetype ?? "application/pdf";

    await this.supabaseService.uploadFile(
      fileKey,
      file.buffer,
      contentType
    );

    const document =
      await this.documentRepository.createDocument({
        userId,
        fileName: file.originalname,
        filePath: fileKey,
        fileSize: file.size,
        mimeType: contentType,
      });

    try {
      await fs.writeFile(temporaryPath, file.buffer);
      await this.processDocument(
        document.id,
        userId,
        temporaryPath
      );

      return this.documentRepository.findById(
        document.id,
        userId
      );
    } catch (error) {
      await this.supabaseService
        .deleteFile(fileKey)
        .catch(() => undefined);
      throw error;
    }
  }

  async getDocument(
    documentId: string,
    userId: string
  ) {
    return this.documentRepository.findById(
      documentId,
      userId
    );
  }

  async getUserDocuments(
    userId: string,
    page: number,
    limit: number
  ) {
    return this.documentRepository.findByUserId(
      userId,
      page,
      limit
    );
  }

  async deleteDocument(
    documentId: string,
    userId: string
  ) {
    const document =
      await this.documentRepository.findById(
        documentId,
        userId
      );

    if (!document) {
      throw new Error("Document not found");
    }

    await this.supabaseService.deleteFile(
      document.fileKey
    );
    await this.documentRepository.delete(
      documentId,
      userId
    );

    return {
      message: "Document deleted successfully",
    };
  }

  async processDocument(
    documentId: string,
    userId: string,
    filePath: string
  ) {
    let processingError:
      | Error
      | null = null;

    try {
      






      await this.documentRepository.update(
        documentId,
        userId,
        {
          status: "PARSING",
          statusMessage:
            "Extracting text from document",
        }
      );

      






      const extracted =
        await this.pdfService.extractPages(
          filePath
        );

      let pages = extracted.pages;

      let hasOcr = false;

      






      const hasReadableText =
        this.pdfService.hasReadableText(
          pages
        );

      






      if (!hasReadableText) {
        await this.documentRepository.update(
          documentId,
          userId,
          {
            status: "OCR_PROCESSING",
            statusMessage:
              "No readable text found. Running OCR.",
          }
        );

        const ocrPages =
          await this.ocrService.processPdf(
            filePath
          );

        const hasOcrText =
          this.ocrService.hasReadableText(
            ocrPages
          );

        




        if (!hasOcrText) {
          await this.documentRepository.markEmptyScanned(
            documentId,
            userId,
            "No readable text could be extracted from this document, including OCR."
          );

          return {
            success: false,
            status:
              "EMPTY_SCANNED_ERROR",
            message:
              "No readable text could be extracted from this document.",
          };
        }

        pages = ocrPages.map(
          (page) => ({
            pageNumber:
              page.pageNumber,
            text: page.text,
          })
        );

        hasOcr = true;
      }

      






      let globalOffset = 0;

      for (const page of pages) {
        const text =
          page.text.trim();

        const startOffset =
          globalOffset;

        const endOffset =
          startOffset + text.length;

        await this.documentRepository.createPage(
          {
            documentId,
            pageNumber:
              page.pageNumber,
            text,
            startOffset,
            endOffset,
          }
        );

        globalOffset =
          endOffset + 1;
      }

      






      const rawText = pages
        .map((page) =>
          page.text.trim()
        )
        .join("\n");

      const normalizedText =
        rawText
          .replace(/\s+/g, " ")
          .trim();

      await this.documentRepository.update(
        documentId,
        userId,
        {
          pageCount: pages.length,
          rawText,
          normalizedText,
          hasOcr,
        }
      );

      






      await this.documentRepository.update(
        documentId,
        userId,
        {
          status: "INDEXING",
          statusMessage:
            "Creating searchable document chunks",
        }
      );

      const chunks =
        this.pdfService.createChunks(
          pages
        );

      if (chunks.length === 0) {
        await this.documentRepository.markFailed(
          documentId,
          userId,
          "Document contains no usable text chunks."
        );

        return {
          success: false,
          status: "FAILED",
          message:
            "Document contains no usable text.",
        };
      }

      






      for (
        let index = 0;
        index < chunks.length;
        index++
      ) {
        const chunk = chunks[index];

        if (!chunk) {
          continue;
        }

        const embedding =
          await this.aiService.generateEmbedding(
            chunk.content
          );

        await this.vectorRepository.createChunk(
          {
            documentId,
            content:
              chunk.content,
            chunkIndex: index,
            startPage:
              chunk.startPage,
            endPage:
              chunk.endPage,
            startOffset:
              chunk.startOffset,
            endOffset:
              chunk.endOffset,
            embedding,
          }
        );
      }

      






      await this.documentRepository.update(
        documentId,
        userId,
        {
          status: "READY",
          statusMessage: hasOcr
            ? "Document processed successfully using OCR."
            : "Document processed successfully.",
        }
      );

      return {
        success: true,
        status: "READY",
        pageCount: pages.length,
        chunkCount: chunks.length,
        hasOcr,
      };
    } catch (error) {
      processingError =
        error instanceof Error
          ? error
          : new Error(
              "Unknown document processing error"
            );

      console.error(
        "Document processing failed:",
        processingError
      );

      







      try {
        await this.documentRepository.markFailed(
          documentId,
          userId,
          processingError.message ||
            "Document processing failed."
        );
      } catch (statusError) {
        console.error(
          "Could not update FAILED status:",
          statusError
        );
      }

      throw processingError;
    } finally {
      



      try {
        await this.ocrService.terminate();
      } catch (error) {
        console.error(
          "OCR cleanup failed:",
          error
        );
      }

      





      try {
        await fs.unlink(filePath);
      } catch {
        
      }
    }
  }
}