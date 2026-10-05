import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Menu,
  MessageSquareText,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Square,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  askQuestion as askQuestionFromBackend,
  checkBackendHealth,
  uploadDocument,
} from "../lib/api";




export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contract Workspace — Veridex" },
      { name: "description", content: "Analyze contracts with exact verified citations, comparisons, and agent research." },
      { property: "og:title", content: "Contract Workspace — Veridex" },
      { property: "og:description", content: "Analyze contracts with exact verified citations, comparisons, and agent research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type DocumentStatus = "READY" | "INDEXING" | "OCR_PROCESSING" | "EMPTY_SCANNED_ERROR";

type Contract = {
  id?: string;
  name: string;
  detail: string;
  status: DocumentStatus;
};

const initialDocuments: Contract[] = [
  { name: "Master Services Agreement", detail: "v4.2 · 38pp", status: "READY" },
  { name: "Vendor DPA — Northwind", detail: "v2.1 · 22pp", status: "READY" },
  { name: "NDA — Halcyon Labs", detail: "v1.0 · 11pp", status: "INDEXING" },
  { name: "SOW — Meridian (scan)", detail: "v3.0 · 16pp", status: "OCR_PROCESSING" },
  { name: "SOW — Meridian", detail: "v2.4 · 8pp", status: "EMPTY_SCANNED_ERROR" },
];

function ActionButton({ children, primary = false, onClick }: { children: ReactNode; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary
        ? "inline-flex h-9 items-center justify-center gap-2 bg-primary px-3 font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        : "inline-flex h-9 items-center justify-center gap-2 border border-border bg-background px-3 font-medium transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"}
    >
      {children}
    </button>
  );
}

function Index() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selected, setSelected] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<"analysis" | "research">("analysis");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("The indemnity is mutual but asymmetric. Northwind caps liability at fees paid, while the vendor carries uncapped gross-negligence exposure — a vendor-favorable posture.");
  const [streaming, setStreaming] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBackendHealth()
      .then(setBackendOnline)
      .catch(() => setBackendOnline(false));
  }, []);

  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setAnswer("Only PDF contracts are supported. Please choose a PDF file.");
      return;
    }
    setStreaming(true);
    setAnswer("Uploading document and starting text extraction…");

    try {
      const uploaded = await uploadDocument(file);
      const name = uploaded.filename.replace(/\.pdf$/i, "");

      setDocuments((current) => [
        {
          id: uploaded.id,
          name,
          detail: `${uploaded.pageCount ?? 0} pages · ${uploaded.status}`,
          status: uploaded.status as DocumentStatus,
        },
        ...current,
      ]);
      setSelected(0);
      setAnswer("Document uploaded. You can ask questions after indexing is ready.");
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "Document upload failed."
      );
    } finally {
      setStreaming(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const documentId = documents[selected]?.id;

    if (!documentId) {
      setAnswer("Upload a document in this session before asking a question.");
      return;
    }

    setStreaming(true);
    setAnswer("Searching indexed clauses and verifying the strongest supporting passage…");

    try {
      const result = await askQuestionFromBackend(
        question.trim(),
        documentId
      );
      setAnswer(result.answer);
      setQuestion("");
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "Question request failed."
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-[13px] text-foreground antialiased lg:h-screen lg:overflow-hidden">
      <input ref={fileRef} type="file" accept="application/pdf" className="sr-only" onChange={(event) => uploadFile(event.target.files?.[0])} />

      <header className="flex h-14 items-center border-b border-border px-4 lg:hidden">
        <button type="button" aria-label="Open navigation" className="mr-3" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button>
        <Brand />
        <button type="button" aria-label="Upload contract" className="ml-auto text-primary" onClick={() => fileRef.current?.click()}><Upload className="size-5" /></button>
      </header>

      <div className="flex lg:h-full">
        {mobileOpen && <button type="button" aria-label="Close navigation backdrop" className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0`}>
          <div className="flex items-center border-b border-border px-5 py-[19px]">
            <Brand />
            <button type="button" aria-label="Close navigation" className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
          </div>
          <nav aria-label="Primary" className="space-y-1 px-3 py-4">
            <NavItem active icon={<FileText />} label="Library" />
            <NavItem icon={<Scale />} label="Comparisons" onClick={() => setMode("analysis")} />
            <NavItem icon={<Bot />} label="Agent research" onClick={() => setMode("research")} />
            <NavItem icon={<FileCheck2 />} label="Citations" />
          </nav>
          <div className="mt-auto border-t border-border px-3 py-4">
            <ActionButton primary onClick={() => fileRef.current?.click()}><Plus className="size-4" /> Upload contract</ActionButton>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">{documents.length} documents · 32MB</div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
              <span className={`size-2 ${backendOnline === true ? "bg-success" : backendOnline === false ? "bg-danger" : "bg-warning"}`} />
              {backendOnline === true ? "Backend connected" : backendOnline === false ? "Backend offline" : "Checking backend"}
            </div>
          </div>
        </aside>

        <section className="hidden w-[280px] shrink-0 flex-col border-r border-border md:flex">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h2 className="font-display text-xl">CASE FILE</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{String(documents.length).padStart(2, "0")}</span>
          </div>
          <div className="overflow-y-auto">
            {documents.map((document, index) => (
              <button key={`${document.name}-${index}`} type="button" onClick={() => setSelected(index)} className={`w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary ${selected === index ? "border-l-2 border-l-primary bg-accent" : ""}`}>
                <div className="truncate font-semibold">{document.name}</div>
                <div className={`mt-1 font-mono text-[11px] ${document.status === "READY" ? "text-muted-foreground" : document.status === "INDEXING" ? "text-warning" : "text-danger"}`}>
                  {document.detail} · {document.status}{document.status !== "READY" && document.status !== "EMPTY_SCANNED_ERROR" ? "…" : ""}
                </div>
              </button>
            ))}
          </div>
        </section>

        <main className="min-w-0 flex-1">
          <div className="flex min-h-16 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl sm:text-2xl">{documents[selected]?.name ?? "Contract"}</h1>
              <p className="font-mono text-[10px] text-muted-foreground md:hidden">{documents[selected]?.detail}</p>
            </div>
            <span className="bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground">Verified</span>
            <div className="ml-auto flex gap-2">
              <ActionButton onClick={() => setMode("analysis")}><Scale className="size-4" /><span className="hidden sm:inline">Compare</span></ActionButton>
              <ActionButton onClick={() => setMode("research")}><Bot className="size-4" /><span className="hidden sm:inline">Run research</span></ActionButton>
            </div>
          </div>

          <div className="grid min-h-0 lg:h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[.15em] text-muted-foreground">Evidence · clause 7.2</div>
              <blockquote className="mb-4 border-l-4 border-primary py-1 pl-4 text-[15px] leading-relaxed">
                “Each party shall <strong>indemnify</strong> the other against third-party claims arising from <strong>gross negligence</strong> or <strong>willful misconduct</strong>.”
              </blockquote>
              <button type="button" className="mb-6 bg-accent px-2 py-1 font-mono text-[11px] font-medium text-primary hover:brightness-95">CIT 07.2 · pg 14 · §7.2(a) · verified</button>

              <div className="mb-3 font-mono text-[11px] uppercase tracking-[.15em] text-muted-foreground">Analysis</div>
              <div className="evidence-in max-w-[64ch] space-y-3 leading-relaxed">
                <p>{answer}</p>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[.15em] text-muted-foreground">
                  <span>{mode === "research" ? "Agent research" : "Ask this contract"}</span>
                  <span>{mode === "research" ? "Round 3 / 5" : "Verified responses"}</span>
                </div>
                {mode === "research" && (
                  <div className="mb-3 max-w-[54ch] border border-border bg-secondary/50 p-3">
                    <div className="flex flex-wrap items-center gap-2"><Search className="size-4 text-primary" /><strong>Searching source</strong><span className="font-mono text-[11px] text-primary">search_document("gross negligence")</span></div>
                    <div className="mt-2 h-1 overflow-hidden bg-accent"><div className="progress-run h-full w-2/5 bg-primary" /></div>
                    <div className="mt-2 font-mono text-[11px] text-muted-foreground">get_section(§7.2) · list_clauses() · 1 exact match</div>
                  </div>
                )}
                <div className="flex max-w-[64ch] border border-input bg-card focus-within:outline-2 focus-within:outline-ring">
                  <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askQuestion(); }} placeholder="Ask about obligations, risks, or termination rights…" className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none placeholder:text-muted-foreground" />
                  <button type="button" aria-label={streaming ? "Stop response" : "Send question"} onClick={streaming ? () => setStreaming(false) : askQuestion} className="m-1 grid size-9 place-items-center bg-foreground text-background transition hover:bg-primary">
                    {streaming ? <Square className="size-3 fill-current" /> : <ArrowRight className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <aside className="border-t border-border px-4 py-5 sm:px-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg">COMPARISON</h2>
                <span className="font-mono text-[10px] text-muted-foreground">MSA ↔ DPA</span>
              </div>
              <Comparison title="Liability cap" level="HIGH" description="MSA caps at $2M; DPA is uncapped for gross negligence." />
              <Comparison title="Data retention" level="MEDIUM" description="DPA deletes after 30d; MSA permits a 12-month archive." />
              <Comparison title="Termination notice" level="LOW" description="Both require 60-day notice; no material conflict." />
              <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground"><span className="status-blink size-2 bg-primary" /> citations verified against source</div>
              <div className="mt-7 border-t border-border pt-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Trust record</div>
                <div className="space-y-2">
                  <TrustLine icon={<ShieldCheck />} text="Exact quote confirmed" />
                  <TrustLine icon={<Check />} text="Page and offset matched" />
                  <TrustLine icon={<MessageSquareText />} text="2 supporting passages" />
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return <div className="flex items-center gap-2"><span className="size-6 bg-primary" /><span className="font-display text-lg leading-none">VERIDEX</span></div>;
}

function NavItem({ active = false, icon, label, onClick }: { active?: boolean; icon: ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:text-foreground ${active ? "border-l-2 border-primary bg-secondary font-semibold text-foreground" : "text-muted-foreground"}`}><span className="[&>svg]:size-4">{icon}</span>{label}</button>;
}

function Comparison({ title, level, description }: { title: string; level: "HIGH" | "MEDIUM" | "LOW"; description: string }) {
  const badge = level === "HIGH" ? "bg-foreground text-background" : level === "MEDIUM" ? "bg-warning text-foreground" : "bg-success text-primary-foreground";
  return (
    <button type="button" className="mb-3 w-full border border-border bg-card p-3 text-left transition hover:border-foreground/30">
      <div className="mb-1 flex items-center justify-between gap-3"><strong>{title}</strong><span className={`${badge} px-2 py-0.5 font-mono text-[10px] tracking-[.15em]`}>{level}</span></div>
      <p className="text-[12px] leading-snug text-muted-foreground">{description}</p>
      <ChevronRight className="mt-2 size-3 text-muted-foreground" />
    </button>
  );
}

function TrustLine({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><span className="text-success [&>svg]:size-4">{icon}</span>{text}</div>;
}
