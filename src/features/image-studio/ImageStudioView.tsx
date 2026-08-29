import { useState, useRef } from "react";
import { UploadCloud, Repeat, Minimize2, Maximize2, FileDown, Loader2, Info } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const formats = ["PNG", "JPG", "WEBP", "AVIF", "TIFF", "SVG", "PDF"];

export function ImageStudioView() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [target, setTarget] = useState("WEBP");
  const [quality, setQuality] = useState([80]);
  const [scale, setScale] = useState([1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setDownloadUrl(null); // Reset previous downloads
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
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("targetFormat", target);
    formData.append("quality", quality[0].toString());
    formData.append("scale", scale[0].toString());

    try {
      const response = await api.post("/api/image-studio/process", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { downloadUrl } = response.data;
      if (downloadUrl) {
        // Build the full absolute URL since api.ts uses the base URL
        const fullDownloadUrl = `${api.defaults.baseURL}${downloadUrl}`;
        setDownloadUrl(fullDownloadUrl);
        
        // Auto-trigger download
        const link = document.createElement("a");
        link.href = fullDownloadUrl;
        link.download = response.data.filename;
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

          {downloadUrl && (
            <Panel className="border-gold/30 bg-gold/5 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-gold/20 p-1">
                  <Info className="size-4 text-gold" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gold">Success! Your file is ready.</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your file was successfully processed and should have downloaded automatically. 
                    It is safely stored on our servers for the next <b>5 minutes</b> before being automatically deleted.
                  </p>
                  <a 
                    href={downloadUrl} 
                    download
                    className="mt-3 inline-flex text-xs font-medium text-gold hover:underline"
                  >
                    Click here to download it again
                  </a>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
