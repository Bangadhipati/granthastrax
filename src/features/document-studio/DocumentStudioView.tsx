import { useState, useRef, useEffect } from "react";
import {
  UploadCloud, Repeat, Minimize2, Maximize2, FileDown,
  Loader2, Clock, Download, FileText, CheckCircle2
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

// ── Supported formats ────────────────────────────────────────────────────────
const CONVERT_FORMATS = ["PDF", "HTML", "TXT"];
const SUPPORTED_INPUT = ["pdf", "docx", "txt", "html", "htm", "rtf"];

// ── Types ────────────────────────────────────────────────────────────────────
interface JobRecord {
  id: string;
  originalName: string;
  filename: string;
  downloadUrl: string;
  steps: string[];
  expiresAt: number;
}

// ── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${enabled ? "bg-gold" : "bg-border"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-300 ${enabled ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function DocumentStudioView() {
  const [file, setFile] = useState<File | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggles
  const [convertEnabled, setConvertEnabled] = useState(true);
  const [compressEnabled, setCompressEnabled] = useState(false);
  const [expandEnabled, setExpandEnabled] = useState(false);

  // Settings
  const [targetFormat, setTargetFormat] = useState("PDF");
  const [compressPercent, setCompressPercent] = useState([60]);
  const [dpi, setDpi] = useState([300]);

  // History
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [now, setNow] = useState(Date.now());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live countdown timer — ticks every second, auto-removes expired jobs
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setJobs(prev => prev.filter(j => j.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Enforce at least one toggle ON
  const handleToggle = (
    which: "convert" | "compress" | "expand",
    value: boolean
  ) => {
    const next = { convert: convertEnabled, compress: compressEnabled, expand: expandEnabled, [which]: value };
    if (!next.convert && !next.compress && !next.expand) return; // block all-off
    setConvertEnabled(next.convert);
    setCompressEnabled(next.compress);
    setExpandEnabled(next.expand);
  };

  // File selection
  const handleFileSelect = (selected: File) => {
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_INPUT.includes(ext)) {
      alert(`Unsupported file type: .${ext}\n\nSupported: ${SUPPORTED_INPUT.join(", ")}`);
      return;
    }
    setFile(selected);
    setPreviewName(selected.name);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  // Process
  const handleRun = async () => {
    if (!file) { alert("Please upload a document first!"); return; }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("convertEnabled", String(convertEnabled));
    formData.append("targetFormat", targetFormat);
    formData.append("compressEnabled", String(compressEnabled));
    formData.append("compressPercent", String(compressPercent[0]));
    formData.append("expandEnabled", String(expandEnabled));
    formData.append("dpi", String(dpi[0]));

    try {
      const res = await api.post("/api/doc-studio/process", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { filename, downloadUrl, steps, originalName } = res.data;
      const fullUrl = `${api.defaults.baseURL}${downloadUrl}`;

      setJobs(prev => [{
        id: filename,
        originalName: originalName ?? file.name,
        filename,
        downloadUrl: fullUrl,
        steps: steps ?? [],
        expiresAt: Date.now() + 5 * 60 * 1000
      }, ...prev]);

      // Auto-trigger download
      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to process document. Please try again.";
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Document Studio"
        title="Documents, exactly as needed."
        description="Format conversion with layout fidelity, size targeting for submission portals, and upscaling for print."
      />

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Upload zone */}
          <Panel className="flex flex-col">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".pdf,.docx,.txt,.html,.htm,.rtf"
              onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
            />
            <div
              className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed py-14 text-center transition-all duration-300 ${isDragging ? "border-gold bg-gold/5" : "border-border"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewName ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-gold/10 p-4">
                    <FileText className="size-8 text-gold" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium max-w-[240px] truncate">{previewName}</p>
                  <p className="text-xs text-muted-foreground">{(file!.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 rounded-full border border-border px-4 py-1.5 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="size-6 text-gold" strokeWidth={1.5} />
                  <p className="mt-4 text-sm">Drop documents here</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, HTML, TXT, RTF · up to 100 MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 rounded-full border border-border px-4 py-2 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                  >
                    Browse files
                  </button>
                </>
              )}
            </div>
          </Panel>

          {/* Recent Jobs */}
          {jobs.length > 0 && (
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="size-4 text-gold" />
                  Recent Jobs
                </h2>
                <p className="text-xs text-muted-foreground">Auto-deleted after 5 min</p>
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs text-foreground bg-muted/50 uppercase border-b">
                    <tr>
                      <th className="px-3 py-2 font-medium">File</th>
                      <th className="px-3 py-2 font-medium">Expires</th>
                      <th className="px-3 py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      const timeLeft = Math.max(0, job.expiresAt - now);
                      const mins = Math.floor(timeLeft / 60000);
                      const secs = Math.floor((timeLeft % 60000) / 1000);
                      const expiring = timeLeft < 60000;
                      return (
                        <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3">
                            <div className="truncate max-w-[180px] font-medium text-foreground text-xs" title={job.originalName}>{job.originalName}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">→ {job.filename}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${expiring ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                              <Clock className="size-3" />
                              {mins}:{secs.toString().padStart(2, "0")}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <a href={job.downloadUrl} download={job.filename} className="inline-flex items-center gap-1 text-gold hover:underline font-medium text-xs">
                              <Download className="size-3" /> Download
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Convert */}
          <Panel className={convertEnabled ? "ring-1 ring-gold/30" : ""}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-4 text-gold" strokeWidth={1.6} />
                <h2 className="text-lg">Convert</h2>
              </div>
              <Toggle enabled={convertEnabled} onChange={v => handleToggle("convert", v)} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Convert to a different file format.</p>
            {convertEnabled && (
              <div className="mt-4 flex items-center gap-3">
                <Select value={targetFormat} onValueChange={setTargetFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONVERT_FORMATS.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Panel>

          {/* Compress */}
          <Panel className={compressEnabled ? "ring-1 ring-gold/30" : ""}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minimize2 className="size-4 text-gold" strokeWidth={1.6} />
                <h2 className="text-lg">Compress</h2>
              </div>
              <Toggle enabled={compressEnabled} onChange={v => handleToggle("compress", v)} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Reduce PDF size by re-optimizing object streams. Best on PDFs.</p>
            {compressEnabled && (
              <>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target size</span>
                  <span className="text-foreground">{compressPercent[0]}% of original</span>
                </div>
                <Slider value={compressPercent} onValueChange={setCompressPercent} min={10} max={100} step={5} className="mt-3" />
              </>
            )}
          </Panel>

          {/* Expand for print */}
          <Panel className={expandEnabled ? "ring-1 ring-gold/30" : ""}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize2 className="size-4 text-gold" strokeWidth={1.6} />
                <h2 className="text-lg">Expand for print</h2>
              </div>
              <Toggle enabled={expandEnabled} onChange={v => handleToggle("expand", v)} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Set the print resolution intent metadata in the output PDF.</p>
            {expandEnabled && (
              <>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Raster resolution</span>
                  <span className="text-foreground">{dpi[0]} DPI</span>
                </div>
                <Slider value={dpi} onValueChange={setDpi} min={72} max={600} step={6} className="mt-3" />
              </>
            )}
          </Panel>

          {/* Active operations summary */}
          <div className="rounded-md border border-border px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-gold" /> Active operations
            </p>
            <ul className="space-y-1">
              {convertEnabled && <li>• Convert → <span className="text-gold font-medium">{targetFormat}</span></li>}
              {compressEnabled && <li>• Compress to <span className="text-gold font-medium">{compressPercent[0]}%</span> of original size</li>}
              {expandEnabled && <li>• Expand print intent to <span className="text-gold font-medium">{dpi[0]} DPI</span></li>}
            </ul>
          </div>

          {/* Run button */}
          <button
            type="button"
            onClick={handleRun}
            disabled={!file || isProcessing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? <><Loader2 className="size-4 animate-spin" /> Processing...</>
              : <><FileDown className="size-4" /> Run &amp; Download</>}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
