import { useState, useRef, useEffect } from "react";
import { UploadCloud, Repeat, Minimize2, Maximize2, FileDown, Loader2, Info, Clock, Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const formats = ["PNG", "JPG", "WEBP", "AVIF", "TIFF", "SVG", "PDF"];

interface ProcessedImage {
  id: string;
  originalName: string;
  filename: string;
  downloadUrl: string;
  expiresAt: number;
}

export function ImageStudioView() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [target, setTarget] = useState("WEBP");
  const [quality, setQuality] = useState([80]);
  const [scale, setScale] = useState([1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      // Auto-remove expired items from the list
      setHistory(prev => prev.filter(item => item.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRun = async () => {
    if (!file) {
      alert("Please drop or select an image first!");
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("targetFormat", target);
    formData.append("quality", quality[0].toString());
    formData.append("scale", scale[0].toString());

    try {
      const response = await api.post("/api/image-studio/process", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { downloadUrl, filename } = response.data;
      if (downloadUrl) {
        // Build the full absolute URL since api.ts uses the base URL
        const fullDownloadUrl = `${api.defaults.baseURL}${downloadUrl}`;
        
        // Add to history (expires in exactly 5 minutes)
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

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel className="flex flex-col">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          
          <div 
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 py-16 text-center overflow-hidden relative ${isDragging ? 'border-gold bg-gold/5' : 'border-border'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img src={previewUrl} alt="Preview" className="max-h-[400px] object-contain rounded-md shadow-lg" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-6 rounded-full bg-black/70 backdrop-blur-md text-white px-4 py-2 text-xs transition-colors duration-300 hover:bg-gold hover:text-black shadow-xl"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="size-6 text-gold" strokeWidth={1.5} />
                <p className="mt-4 text-sm">Drop images here</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WEBP, AVIF, TIFF · up to 40 MB each
                </p>
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

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Convert</h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Convert between raster formats, trace to SVG vectors, or export to PDF.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={handleRun}
                disabled={!file || isProcessing}
                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />} 
                {isProcessing ? "Processing..." : "Run & Download"}
              </button>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Minimize2 className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Compress</h2>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Quality</span>
              <span className="text-foreground">{quality[0]}%</span>
            </div>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={10}
              max={100}
              step={1}
              className="mt-3"
            />
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Maximize2 className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Upscale & Resize</h2>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Scale Factor</span>
              <span className="text-foreground">{scale[0]}×</span>
            </div>
            <Slider
              value={scale}
              onValueChange={setScale}
              min={0.1}
              max={4}
              step={0.1}
              className="mt-3"
            />
          </Panel>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <Panel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Clock className="size-4 text-gold" />
                Processed Images
              </h2>
              <p className="text-xs text-muted-foreground">
                Files are automatically permanently deleted after 5 minutes.
              </p>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs text-foreground bg-muted/50 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Original File</th>
                    <th className="px-4 py-3 font-medium">Result File</th>
                    <th className="px-4 py-3 font-medium">Time Remaining</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const timeLeft = Math.max(0, item.expiresAt - now);
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    const isExpiringSoon = timeLeft < 60000;

                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 truncate max-w-[200px]" title={item.originalName}>{item.originalName}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.filename}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isExpiringSoon ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            <Clock className="size-3" />
                            {timeString}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={item.downloadUrl}
                            download={item.filename}
                            className="inline-flex items-center gap-1 text-gold hover:text-gold/80 hover:underline font-medium text-xs"
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
        </div>
      )}
    </AppShell>
  );
}
