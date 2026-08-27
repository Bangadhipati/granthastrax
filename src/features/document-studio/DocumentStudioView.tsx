import { useState } from "react";
import { UploadCloud, Repeat, Minimize2, Maximize2, FileDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formats = ["PDF", "DOCX", "ODT", "TEX", "RTF", "TXT", "EPUB", "HTML"];

const recent = [
  { name: "grant-proposal-final.docx", from: "DOCX", to: "PDF", size: "1.8 MB" },
  { name: "thesis-chapter-3.tex", from: "TEX", to: "PDF", size: "740 KB" },
  { name: "annual-report.pdf", from: "PDF", to: "DOCX", size: "4.2 MB" },
];

export function DocumentStudioView() {
  const [target, setTarget] = useState("PDF");
  const [size, setSize] = useState([60]);
  const [dpi, setDpi] = useState([300]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Document Studio"
        title="Documents, exactly as needed."
        description="Format conversion with layout fidelity, size targeting for submission portals, and upscaling for print houses."
      />

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
              <UploadCloud className="size-6 text-gold" strokeWidth={1.5} />
              <p className="mt-4 text-sm">Drop documents here</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, ODT, TEX, RTF, EPUB · up to 100 MB
              </p>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg">Recent jobs</h2>
            <ul className="mt-4 divide-y divide-border text-xs">
              {recent.map((r) => (
                <li key={r.name} className="flex items-center justify-between py-3">
                  <span className="truncate pr-4">{r.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {r.from} → <span className="text-gold">{r.to}</span> · {r.size}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Convert</h2>
            </div>
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
              <span>Target of original</span>
              <span className="text-foreground">{size[0]}%</span>
            </div>
            <Slider value={size} onValueChange={setSize} min={10} max={100} step={5} className="mt-3" />
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Maximize2 className="size-4 text-gold" strokeWidth={1.6} />
              <h2 className="text-lg">Expand for print</h2>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Raster resolution</span>
              <span className="text-foreground">{dpi[0]} DPI</span>
            </div>
            <Slider value={dpi} onValueChange={setDpi} min={72} max={600} step={6} className="mt-3" />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
