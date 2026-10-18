import { useState, useRef, useEffect } from "react";
import {
  UploadCloud, Repeat, Minimize2, Maximize2, FileDown,
  Loader2, Clock, Download, Image as ImageIcon,
  Check, Trash2, RefreshCw, Layers, Sparkles, Sliders
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const FORMATS = ["WEBP", "AVIF", "PNG", "JPG", "TIFF", "SVG", "PDF"] as const;

interface ProcessedImage {
  id: string;
  originalName: string;
  filename: string;
  downloadUrl: string;
  expiresAt: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

export function ImageStudioView() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [target, setTarget] = useState<string>("WEBP");
  const [quality, setQuality] = useState<number[]>([80]);
  const [scale, setScale] = useState<number[]>([1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live countdown timer — ticks every second, auto-removes expired items
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setHistory(prev => prev.filter(item => item.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Read natural image dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  };

  const handleClearImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileExt = file?.name.split(".").pop()?.toUpperCase() ?? "";
  const activeQuality = quality[0] ?? 80;
  const activeScale = scale[0] ?? 1;

  // Projected output dimensions
  const outputWidth = dimensions ? Math.round(dimensions.width * activeScale) : null;
  const outputHeight = dimensions ? Math.round(dimensions.height * activeScale) : null;

  const handleRun = async () => {
    if (!file) {
      alert("Please drop or select an image first!");
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("targetFormat", target);
    formData.append("quality", String(activeQuality));
    formData.append("scale", String(activeScale));

    try {
      const response = await api.post("/api/image-studio/process", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { downloadUrl, filename } = response.data;
      if (downloadUrl) {
        const fullDownloadUrl = `${api.defaults.baseURL}${downloadUrl}`;
        
        const newItem: ProcessedImage = {
          id: filename,
          originalName: file.name,
          filename: filename,
          downloadUrl: fullDownloadUrl,
          expiresAt: Date.now() + 5 * 60 * 1000 
        };
        
        setHistory(prev => [newItem, ...prev]);
        
        // Auto-trigger download
        const link = document.createElement("a");
        link.href = fullDownloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Image Studio"
        title="Convert, compress, enlarge."
        description="Drop a file once and run every operation from the same surface — no re-uploading between steps."
      />

      {/* Widescreen-optimized responsive layout with bottom dock buffer */}
      <div className="mx-auto mt-4 sm:mt-6 max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── Left Column: Preview, Inspector & Output History (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            
            <Panel className="p-5 overflow-hidden transition-all duration-300">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileSelect(selected);
                }}
              />

              {previewUrl && file ? (
                /* Active Image Inspector & Preview */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Image Loaded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors p-1"
                      title="Remove image"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  {/* Image Viewport Canvas */}
                  <div className="relative w-full rounded-lg border border-border bg-black/40 overflow-hidden flex items-center justify-center p-4 min-h-[280px] max-h-[420px]">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-[380px] max-w-full object-contain rounded-md shadow-md"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 rounded-md bg-background/85 backdrop-blur-md border border-border/80 text-foreground px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold/50 hover:text-gold shadow-lg flex items-center gap-1.5"
                    >
                      <RefreshCw className="size-3 text-gold" />
                      <span>Change Image</span>
                    </button>
                  </div>

                  {/* Metadata Specs Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-md bg-secondary/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-mono">FILE NAME</span>
                      <span className="font-semibold text-foreground truncate block mt-0.5" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-secondary/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-mono">FORMAT</span>
                      <span className="font-semibold text-gold block mt-0.5">
                        {fileExt || "IMAGE"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-secondary/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-mono">RAW SIZE</span>
                      <span className="font-semibold text-foreground block mt-0.5">
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-secondary/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-mono">DIMENSIONS</span>
                      <span className="font-semibold text-foreground block mt-0.5 font-mono">
                        {dimensions ? `${dimensions.width} × ${dimensions.height} px` : "Loading..."}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Drag & Drop Zone */
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-14 px-6 text-center transition-all duration-300 ${
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
                    Drop image to begin
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
                    Drag and drop your graphic, illustration, or photo here, or browse from your device.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                    {FORMATS.map(fmt => (
                      <span key={fmt} className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-secondary/80 text-muted-foreground border border-border">
                        .{fmt.toLowerCase()}
                      </span>
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-1 font-sans">
                      (up to 40 MB)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-gold text-black font-semibold px-5 py-2.5 text-xs hover:bg-gold/90 transition shadow-sm"
                  >
                    <UploadCloud className="size-4" />
                    <span>Browse Images</span>
                  </button>
                </div>
              )}
            </Panel>

            {/* Output History or Capabilities Matrix */}
            {history.length > 0 ? (
              <Panel className="p-5">
                <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gold" />
                    <h3 className="text-sm font-semibold text-foreground">Processed Images</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gold/15 text-gold border border-gold/30">
                      {history.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Auto-purged after 5 min</p>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-muted-foreground bg-muted/40 uppercase font-mono border-b border-border">
                      <tr>
                        <th className="px-3.5 py-2.5 font-medium">Source</th>
                        <th className="px-3.5 py-2.5 font-medium">Output Result</th>
                        <th className="px-3.5 py-2.5 font-medium">Expires</th>
                        <th className="px-3.5 py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {history.map((item) => {
                        const timeLeft = Math.max(0, item.expiresAt - now);
                        const mins = Math.floor(timeLeft / 60000);
                        const secs = Math.floor((timeLeft % 60000) / 1000);
                        const isExpiringSoon = timeLeft < 60000;

                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3.5 py-3 truncate max-w-[170px] font-medium text-foreground text-xs" title={item.originalName}>
                              {item.originalName}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-gold truncate max-w-[180px]">
                              {item.filename}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                                isExpiringSoon ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                <Clock className="size-3" />
                                {mins}:{secs.toString().padStart(2, '0')}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <a
                                href={item.downloadUrl}
                                download={item.filename}
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
                    <h4 className="text-xs font-semibold text-foreground">Multi-Format</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Convert between WebP, AVIF, PNG, JPG, TIFF, SVG vector tracing, and PDF export.
                  </p>
                </Panel>

                <Panel className="p-4 border border-border/80 bg-card/40">
                  <div className="flex items-center gap-2 mb-1.5 text-gold">
                    <Minimize2 className="size-4" />
                    <h4 className="text-xs font-semibold text-foreground">Lossy & Lossless</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Advanced MozJPEG and WebP compaction stripping bloated metadata with zero noticeable degradation.
                  </p>
                </Panel>

                <Panel className="p-4 border border-border/80 bg-card/40">
                  <div className="flex items-center gap-2 mb-1.5 text-gold">
                    <Maximize2 className="size-4" />
                    <h4 className="text-xs font-semibold text-foreground">Lanczos Rescaling</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Scale up to 4× with edge-preserving interpolation for print-quality book covers and posters.
                  </p>
                </Panel>
              </div>
            )}

          </div>

          {/* ── Right Column: Configuration & Unified Run Action (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            
            {/* Convert Format Card */}
            <Panel className="p-4 border-gold/30 ring-1 ring-gold/20 bg-card/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gold/15 text-gold">
                    <Repeat className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Target Format</h3>
                    <p className="text-[11px] text-muted-foreground">Transcode or trace to vector</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gold text-black">
                  .{target.toLowerCase()}
                </span>
              </div>

              {/* Quick Format Pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTarget(f)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                      target === f
                        ? "bg-gold text-black font-bold shadow-xs"
                        : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBP" className="text-xs font-mono">WEBP — High efficiency web image</SelectItem>
                  <SelectItem value="AVIF" className="text-xs font-mono">AVIF — Next-generation compaction</SelectItem>
                  <SelectItem value="PNG" className="text-xs font-mono">PNG — Lossless raster with alpha channel</SelectItem>
                  <SelectItem value="JPG" className="text-xs font-mono">JPG — Standard photographic JPEG</SelectItem>
                  <SelectItem value="TIFF" className="text-xs font-mono">TIFF — Print-master archival format</SelectItem>
                  <SelectItem value="SVG" className="text-xs font-mono">SVG — Vector auto-traced paths</SelectItem>
                  <SelectItem value="PDF" className="text-xs font-mono">PDF — Document page wrap</SelectItem>
                </SelectContent>
              </Select>
            </Panel>

            {/* Compress Quality Card */}
            <Panel className="p-4 bg-card/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-secondary text-foreground">
                    <Minimize2 className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Compression Quality</h3>
                    <p className="text-[11px] text-muted-foreground">Balance byte size vs visual clarity</p>
                  </div>
                </div>
                <span className="font-mono text-gold font-bold text-xs">{activeQuality}%</span>
              </div>

              <Slider
                value={quality}
                onValueChange={setQuality}
                min={10}
                max={100}
                step={1}
                className="py-2"
              />

              {/* Quality Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: "Web 65%", val: 65 },
                  { label: "Standard 80%", val: 80 },
                  { label: "Max 95%", val: 95 }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setQuality([p.val])}
                    className={`py-1 rounded text-[10px] font-medium border transition-all ${
                      activeQuality === p.val
                        ? "bg-gold text-black border-gold font-bold"
                        : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Panel>

            {/* Upscale & Resize Card */}
            <Panel className="p-4 bg-card/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-secondary text-foreground">
                    <Maximize2 className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Upscale & Resize</h3>
                    <p className="text-[11px] text-muted-foreground">Interpolated dimension factor</p>
                  </div>
                </div>
                <span className="font-mono text-gold font-bold text-xs">{activeScale}×</span>
              </div>

              <Slider
                value={scale}
                onValueChange={setScale}
                min={0.25}
                max={4}
                step={0.05}
                className="py-2"
              />

              {/* Scale Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: "0.5×", val: 0.5 },
                  { label: "1× Original", val: 1 },
                  { label: "2× HD", val: 2 },
                  { label: "4× Ultra", val: 4 }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setScale([p.val])}
                    className={`py-1 rounded text-[10px] font-medium border transition-all ${
                      activeScale === p.val
                        ? "bg-gold text-black border-gold font-bold"
                        : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {outputWidth && outputHeight && (
                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Output size:</span>
                  <span className="text-foreground font-semibold">
                    {outputWidth} × {outputHeight} px
                  </span>
                </div>
              )}
            </Panel>

            {/* Live Pipeline Execution Summary */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-3.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Layers className="size-3.5 text-gold" /> Processing Pipeline
                </span>
                <span className="text-[10px] font-mono text-gold font-medium">
                  {target} • {activeQuality}% • {activeScale}×
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between py-0.5 border-b border-border/30">
                  <span className="flex items-center gap-1 text-foreground">
                    <Check className="size-3 text-gold" /> Format Transcoding
                  </span>
                  <span className="font-mono text-gold font-medium">→ {target}</span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-border/30">
                  <span className="flex items-center gap-1 text-foreground">
                    <Check className="size-3 text-gold" /> Quality Compression
                  </span>
                  <span className="font-mono text-gold font-medium">{activeQuality}%</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1 text-foreground">
                    <Check className="size-3 text-gold" /> Resolution Scaling
                  </span>
                  <span className="font-mono text-gold font-medium">
                    {outputWidth ? `${outputWidth} × ${outputHeight} px (${activeScale}×)` : `${activeScale}×`}
                  </span>
                </div>
              </div>
            </div>

            {/* Prominent Run & Download Action Button */}
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
                  <span>Processing Image...</span>
                </>
              ) : (
                <>
                  <FileDown className="size-4" />
                  <span>{file ? "Run & Download Result" : "Upload Image to Process"}</span>
                </>
              )}
            </button>

            {!file && (
              <p className="text-[11px] text-center text-muted-foreground">
                Select or drop an image on the left to activate processing.
              </p>
            )}

          </div>

        </div>
      </div>
    </AppShell>
  );
}
