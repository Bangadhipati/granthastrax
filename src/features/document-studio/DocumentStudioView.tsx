import { useState, useRef, useEffect } from "react";
import {
  UploadCloud, Repeat, Minimize2, Maximize2, FileDown,
  Loader2, Clock, Download, FileText, CheckCircle2,
  Trash2, Sparkles, Check, ArrowRight, ShieldCheck,
  FileCode, Printer, Info, Layers, RefreshCw
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

    // Smart default target format based on uploaded file
    if (ext === "docx") {
      setTargetFormat("PDF");
    } else if (ext === "pdf") {
      setTargetFormat("PDF");
      // If uploading PDF, encourage compression or print expansion
      if (!compressEnabled && !expandEnabled) {
        setCompressEnabled(true);
      }
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  // Helper format sizing
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileExt = file?.name.split(".").pop()?.toUpperCase() ?? "";

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

      {/* Optimized widescreen layout with balanced padding avoiding bottom dock collisions */}
      <div className="mx-auto mt-4 sm:mt-6 max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── Left Column: Upload & Workstation History (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            
            {/* Upload Zone / Document Inspector Card */}
            <Panel className="p-5 overflow-hidden transition-all duration-300">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".pdf,.docx,.txt,.html,.htm,.rtf"
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />

              {file ? (
                /* Active Document Inspector */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Document Loaded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors p-1"
                      title="Remove document"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-card/60 border border-border">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/15 border border-gold/30 text-gold shadow-sm">
                        <FileText className="size-6" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate" title={file.name}>
                            {file.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gold text-black shrink-0">
                            {fileExt}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1 font-sans">
                            <Check className="size-3" /> Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/80 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:border-gold/40 transition shrink-0"
                    >
                      <RefreshCw className="size-3.5 text-gold" />
                      <span>Change File</span>
                    </button>
                  </div>

                  {/* Contextual Guidance Pill based on uploaded format */}
                  <div className="flex items-start gap-2.5 p-3 rounded-md bg-secondary/40 border border-border/80 text-xs text-muted-foreground">
                    <Info className="size-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      {fileExt === "PDF" && (
                        <span>
                          PDF input ready. Use <strong className="text-foreground">Compress</strong> to target portal upload thresholds or <strong className="text-foreground">Expand for print</strong> to calibrate raster DPI metadata.
                        </span>
                      )}
                      {fileExt === "DOCX" && (
                        <span>
                          Microsoft Word document detected. GranthAstraX preserves headings, typography, tables, and spacing during conversion to <strong className="text-foreground">{targetFormat}</strong>.
                        </span>
                      )}
                      {(fileExt === "HTML" || fileExt === "HTM") && (
                        <span>
                          Web markup loaded. Converts directly into publication-grade PDF with CSS layout fidelity.
                        </span>
                      )}
                      {(fileExt === "TXT" || fileExt === "RTF") && (
                        <span>
                          Plain text source ready for structured PDF typesetting and archiving.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Drag & Drop Zone */
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 px-6 text-center transition-all duration-300 ${
                    isDragging ? "border-gold bg-gold/10 scale-[0.99]" : "border-border hover:border-gold/50 hover:bg-card/30"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border border-gold/20 mb-4 shadow-sm">
                    <UploadCloud className="size-7 text-gold animate-pulse" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Drop document to begin
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
                    Drag and drop your manuscript or document here, or browse from your device.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                    {SUPPORTED_INPUT.map(fmt => (
                      <span key={fmt} className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-secondary/80 text-muted-foreground border border-border">
                        .{fmt}
                      </span>
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-1 font-sans">
                      (up to 100 MB)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-gold text-black font-semibold px-5 py-2.5 text-xs hover:bg-gold/90 transition shadow-sm"
                  >
                    <UploadCloud className="size-4" />
                    <span>Browse Document</span>
                  </button>
                </div>
              )}
            </Panel>

            {/* Recent Jobs or Capabilities Card */}
            {jobs.length > 0 ? (
              <Panel className="p-5">
                <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gold" />
                    <h3 className="text-sm font-semibold text-foreground">Recent Outputs</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gold/15 text-gold border border-gold/30">
                      {jobs.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Auto-purged after 5 min</p>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-muted-foreground bg-muted/40 uppercase font-mono border-b border-border">
                      <tr>
                        <th className="px-3.5 py-2.5 font-medium">Output Document</th>
                        <th className="px-3.5 py-2.5 font-medium">Pipeline</th>
                        <th className="px-3.5 py-2.5 font-medium">Expires</th>
                        <th className="px-3.5 py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {jobs.map(job => {
                        const timeLeft = Math.max(0, job.expiresAt - now);
                        const mins = Math.floor(timeLeft / 60000);
                        const secs = Math.floor((timeLeft % 60000) / 1000);
                        const expiring = timeLeft < 60000;
                        return (
                          <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3.5 py-3">
                              <div className="truncate max-w-[170px] sm:max-w-[220px] font-medium text-foreground text-xs" title={job.originalName}>
                                {job.originalName}
                              </div>
                              <div className="text-[10px] text-gold font-mono mt-0.5 truncate max-w-[180px]">
                                → {job.filename}
                              </div>
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {job.steps.map((st, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary border border-border text-foreground">
                                    {st.split(":")[0]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3.5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                                expiring ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              }`}>
                                <Clock className="size-3" />
                                {mins}:{secs.toString().padStart(2, "0")}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <a
                                href={job.downloadUrl}
                                download={job.filename}
                                className="inline-flex items-center gap-1.5 text-black bg-gold hover:bg-gold/90 px-3 py-1.5 rounded-md font-semibold text-[11px] transition shadow-xs"
                              >
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
            ) : (
              /* Features & Engine Specs Overview (Balances left screen space) */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Panel className="p-4 border border-border/80 bg-card/40">
                  <div className="flex items-center gap-2 mb-1.5 text-gold">
                    <Repeat className="size-4" />
                    <h4 className="text-xs font-semibold text-foreground">Layout Fidelity</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Preserves styles, tables, headings, and formatting when converting DOCX and HTML into PDF.
                  </p>
                </Panel>

                <Panel className="p-4 border border-border/80 bg-card/40">
                  <div className="flex items-center gap-2 mb-1.5 text-gold">
                    <Minimize2 className="size-4" />
                    <h4 className="text-xs font-semibold text-foreground">Stream Compaction</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Re-optimizes PDF streams and fonts to meet strict upload size limits for academic portals.
                  </p>
                </Panel>

                <Panel className="p-4 border border-border/80 bg-card/40">
                  <div className="flex items-center gap-2 mb-1.5 text-gold">
                    <Printer className="size-4" />
                    <h4 className="text-xs font-semibold text-foreground">Print Intent</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Embeds high-resolution raster calibration (up to 600 DPI) for print-on-demand presses.
                  </p>
                </Panel>
              </div>
            )}

          </div>

          {/* ── Right Column: Configuration & Pipeline Execution (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            
            {/* Convert Operation Card */}
            <Panel className={`p-4 transition-all duration-200 ${convertEnabled ? "ring-1 ring-gold/40 border-gold/30 bg-card/80" : "opacity-80"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${convertEnabled ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                    <Repeat className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Convert Format</h3>
                    <p className="text-[11px] text-muted-foreground">Document syntax conversion</p>
                  </div>
                </div>
                <Toggle enabled={convertEnabled} onChange={v => handleToggle("convert", v)} />
              </div>

              {convertEnabled && (
                <div className="mt-3.5 pt-3 border-t border-border/50 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Target Format</span>
                    <span className="font-mono text-gold font-semibold">.{targetFormat.toLowerCase()}</span>
                  </div>
                  <Select value={targetFormat} onValueChange={setTargetFormat}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONVERT_FORMATS.map(f => (
                        <SelectItem key={f} value={f} className="text-xs font-mono">
                          {f} {f === "PDF" ? "— Portable Document Format" : f === "HTML" ? "— Web Markup" : "— Plain Text"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </Panel>

            {/* Compress Operation Card */}
            <Panel className={`p-4 transition-all duration-200 ${compressEnabled ? "ring-1 ring-gold/40 border-gold/30 bg-card/80" : "opacity-80"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${compressEnabled ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                    <Minimize2 className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Compress Document</h3>
                    <p className="text-[11px] text-muted-foreground">Compact object streams for portal limits</p>
                  </div>
                </div>
                <Toggle enabled={compressEnabled} onChange={v => handleToggle("compress", v)} />
              </div>

              {compressEnabled && (
                <div className="mt-3.5 pt-3 border-t border-border/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Target Size Ratio</span>
                    <span className="font-mono text-gold font-bold">{compressPercent[0]}%</span>
                  </div>
                  
                  <Slider
                    value={compressPercent}
                    onValueChange={setCompressPercent}
                    min={10}
                    max={100}
                    step={5}
                    className="py-1"
                  />

                  {/* Preset Quick Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { label: "Max 40%", val: 40 },
                      { label: "Balanced 60%", val: 60 },
                      { label: "Light 80%", val: 80 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setCompressPercent([p.val])}
                        className={`py-1 rounded text-[10px] font-medium border transition-all ${
                          compressPercent[0] === p.val
                            ? "bg-gold text-black border-gold font-bold"
                            : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            {/* Expand for Print Card */}
            <Panel className={`p-4 transition-all duration-200 ${expandEnabled ? "ring-1 ring-gold/40 border-gold/30 bg-card/80" : "opacity-80"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${expandEnabled ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                    <Maximize2 className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Expand for Print</h3>
                    <p className="text-[11px] text-muted-foreground">Embed publishing resolution intent</p>
                  </div>
                </div>
                <Toggle enabled={expandEnabled} onChange={v => handleToggle("expand", v)} />
              </div>

              {expandEnabled && (
                <div className="mt-3.5 pt-3 border-t border-border/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Raster Density</span>
                    <span className="font-mono text-gold font-bold">{dpi[0]} DPI</span>
                  </div>

                  <Slider
                    value={dpi}
                    onValueChange={setDpi}
                    min={72}
                    max={600}
                    step={6}
                    className="py-1"
                  />

                  {/* DPI Presets */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { label: "150 Web", val: 150 },
                      { label: "300 Print", val: 300 },
                      { label: "600 Ultra", val: 600 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setDpi([p.val])}
                        className={`py-1 rounded text-[10px] font-medium border transition-all ${
                          dpi[0] === p.val
                            ? "bg-gold text-black border-gold font-bold"
                            : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            {/* Pipeline Execution Summary */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-3.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Layers className="size-3.5 text-gold" /> Active Pipeline
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {[convertEnabled, compressEnabled, expandEnabled].filter(Boolean).length} step(s)
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {convertEnabled && (
                  <div className="flex items-center justify-between py-0.5 border-b border-border/30">
                    <span className="flex items-center gap-1 text-foreground">
                      <CheckCircle2 className="size-3 text-gold" /> Convert
                    </span>
                    <span className="font-mono text-gold font-medium">→ {targetFormat}</span>
                  </div>
                )}
                {compressEnabled && (
                  <div className="flex items-center justify-between py-0.5 border-b border-border/30">
                    <span className="flex items-center gap-1 text-foreground">
                      <CheckCircle2 className="size-3 text-gold" /> Compress
                    </span>
                    <span className="font-mono text-gold font-medium">{compressPercent[0]}% target</span>
                  </div>
                )}
                {expandEnabled && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="flex items-center gap-1 text-foreground">
                      <CheckCircle2 className="size-3 text-gold" /> Print Intent
                    </span>
                    <span className="font-mono text-gold font-medium">{dpi[0]} DPI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={!file || isProcessing}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.99] ${
                !file || isProcessing
                  ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed opacity-60"
                  : "bg-gold text-black hover:bg-gold/90 shadow-md cursor-pointer"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <FileDown className="size-4" />
                  <span>{file ? "Run & Download Result" : "Upload Document to Process"}</span>
                </>
              )}
            </button>

            {!file && (
              <p className="text-[11px] text-center text-muted-foreground">
                Select or drop a document on the left to activate processing.
              </p>
            )}

          </div>

        </div>
      </div>
    </AppShell>
  );
}
