const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:9004/api/v1";

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

export type UploadedDocument = {
  id: string;
  filename: string;
  status: string;
  pageCount?: number;
};

export type ChatResult = {
  answer: string;
  citations: unknown[];
};

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
  });
  const result =
    (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || result.data === undefined) {
    throw new Error(result.message ?? "API request failed");
  }

  return result.data;
}

export async function checkBackendHealth(): Promise<boolean> {
  const response = await fetch(`${API_URL}/test`);

  if (!response.ok) {
    return false;
  }

  const result: unknown = await response.json();

  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    result.success === true
  );
}

export async function uploadDocument(
  file: File
): Promise<UploadedDocument> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    body,
    credentials: "include",
  });

  const result =
    (await response.json()) as ApiEnvelope<UploadedDocument>;

  if (!response.ok || !result.data) {
    throw new Error(result.message ?? "Document upload failed");
  }

  return result.data;
}

export async function askQuestion(
  question: string,
  documentId: string
): Promise<ChatResult> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      question,
      documentId,
    }),
  });

  const result =
    (await response.json()) as ApiEnvelope<ChatResult>;

  if (!response.ok || !result.data) {
    throw new Error(result.message ?? "Question request failed");
  }

  return result.data;
}

export function listDocuments(page = 1, limit = 20) {
  return request<{
    documents: UploadedDocument[];
    total: number;
  }>(`/documents?page=${page}&limit=${limit}`);
}

export function getDocument(documentId: string) {
  return request<UploadedDocument>(`/documents/${documentId}`);
}

export function getDocumentPage(
  documentId: string,
  pageNumber: number
) {
  return request<unknown>(
    `/documents/${documentId}/pages/${pageNumber}`
  );
}

export function getDocumentPages(
  documentId: string,
  startPage: number,
  endPage: number
) {
  return request<unknown>(
    `/documents/${documentId}/pages?startPage=${startPage}&endPage=${endPage}`
  );
}

export function askMultipleDocuments(
  question: string,
  documentIds: string[],
  sessionId?: string
) {
  return request<unknown>("/chat/multi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, documentIds, sessionId }),
  });
}

export function getCitation(citationId: string) {
  return request<unknown>(`/citations/${citationId}`);
}

export function createComparison(
  sourceDocumentId: string,
  targetDocumentId: string
) {
  return request<unknown>("/comparisons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceDocumentId, targetDocumentId }),
  });
}

export function listComparisons() {
  return request<unknown[]>("/comparisons");
}

export function getComparison(comparisonId: string) {
  return request<unknown>(`/comparisons/${comparisonId}`);
}

export function deleteComparison(comparisonId: string) {
  return request<unknown>(`/comparisons/${comparisonId}`, {
    method: "DELETE",
  });
}

export function runAgentResearch(
  question: string,
  documentId: string,
  sessionId?: string
) {
  return request<unknown>("/agent/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, documentId, sessionId }),
  });
}
