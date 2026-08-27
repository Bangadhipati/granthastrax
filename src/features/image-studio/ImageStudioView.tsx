import { useState } from "react";
import { UploadCloud, Repeat, Minimize2, Maximize2, FileDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formats = ["PNG", "JPG", "WEBP", "AVIF", "TIFF", "SVG", "PDF"];

export function ImageStudioView() {
  const [target, setTarget] = useState("PDF");
  const [quality, setQuality] = useState([72]);
  const [scale, setScale] = useState([2]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Image Studio"
        title="Convert, compress, enlarge."
        description="Drop a file once and run every operation from the same surface — no re-uploading between steps."
      />

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel className="flex flex-col">
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <UploadCloud className="size-6 text-gold" strokeWidth={1.5} />
            <p className="mt-4 text-sm">Drop images here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, WEBP, AVIF, TIFF, SVG · up to 40 MB each
            </p>
            <button
              type="button"
              className="mt-6 rounded-full border border-border px-4 py-2 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold"
            >
              Browse files
            </button>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Convert</h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Batch convert to any format, including a multi-page PDF.
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
                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90"
              >
                <FileDown className="size-3.5" /> Run
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
              <h2 className="text-lg">Upscale</h2>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Factor</span>
              <span className="text-foreground">{scale[0]}×</span>
            </div>
            <Slider
              value={scale}
              onValueChange={setScale}
              min={1}
              max={8}
              step={1}
              className="mt-3"
            />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
