import { useMemo, useState } from "react";
import { UploadCloud, Download, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const trims = [
  { id: "5x8", label: '5" × 8"', ratio: 0.625 },
  { id: "5.5x8.5", label: '5.5" × 8.5"', ratio: 0.647 },
  { id: "6x9", label: '6" × 9"', ratio: 0.667 },
  { id: "7x10", label: '7" × 10"', ratio: 0.7 },
];

const papers = [
  { id: "cream-60", label: "Cream 60# uncoated", ppi: 400 },
  { id: "white-50", label: "White 50# uncoated", ppi: 434 },
  { id: "white-70", label: "White 70# smooth", ppi: 356 },
  { id: "matte-80", label: "Matte 80# coated", ppi: 300 },
];

const covers = [
  { id: "paperback", label: "Paperback, matte" },
  { id: "paperback-gloss", label: "Paperback, gloss" },
  { id: "hardcover", label: "Hardcover, case wrap" },
  { id: "hardcover-jacket", label: "Hardcover + dust jacket" },
];

export function WriterView() {
  const [trim, setTrim] = useState<string>("6x9");
  const [paper, setPaper] = useState<string>("cream-60");
  const [cover, setCover] = useState<string>("paperback");
  const [pages, setPages] = useState([320]);
  const [rotated, setRotated] = useState(false);

  const trimSpec = trims.find((t) => t.id === trim) ?? trims[2]!;
  const paperSpec = papers.find((p) => p.id === paper) ?? papers[0]!;
  const isHard = cover.startsWith("hardcover");

  const spine = useMemo(() => {
    const base = (pages[0] ?? 0) / paperSpec.ppi;
    return (base + (isHard ? 0.25 : 0.06)).toFixed(3);
  }, [pages, paperSpec.ppi, isHard]);

  const coverHeight = 340;
  const coverWidth = coverHeight * trimSpec.ratio;
  const spineDepth = Math.max(10, Number(spine) * 26);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writer Desk"
        title="Print-ready, before you print."
        description="Set the physical specification of your book and GranthAstraX derives the spine, the bleed and a matching interior template."
      />

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col gap-4">
          <Panel>
            <h2 className="text-lg">Specification</h2>
            <div className="mt-5 space-y-5">
              <Field label="Trim size">
                <Select value={trim} onValueChange={setTrim}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trims.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Paper stock">
                <Select value={paper} onValueChange={setPaper}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cover type">
                <Select value={cover} onValueChange={setCover}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {covers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page count</span>
                  <span className="text-foreground">{pages[0]} pages</span>
                </div>
                <Slider
                  value={pages}
                  onValueChange={setPages}
                  min={24}
                  max={900}
                  step={2}
                  className="mt-3"
                />
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="grid grid-cols-3 gap-4 text-center">
              <Stat label="Spine" value={`${spine}"`} />
              <Stat label="Bleed" value={'0.125"'} />
              <Stat label="Full cover" value={`${(Number(coverWidth / coverHeight) * 9 * 2 + Number(spine)).toFixed(2)}"`} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold"
              >
                <UploadCloud className="size-3.5" /> Upload cover artwork
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90"
              >
                <Download className="size-3.5" /> Download template
              </button>
            </div>
          </Panel>
        </div>

        <Panel className="flex flex-col items-center justify-center overflow-hidden">
          <div
            className="grid w-full place-items-center py-10"
            style={{ perspective: "1400px" }}
          >
            <div
              className="relative transition-transform duration-700 ease-out"
              style={{
                width: coverWidth,
                height: coverHeight,
                transformStyle: "preserve-3d",
                transform: `rotateX(-6deg) rotateY(${rotated ? -152 : -28}deg)`,
              }}
            >
              {/* Front cover */}
              <div
                className="absolute inset-0 rounded-r-sm border border-gold/25"
                style={{
                  background: "var(--gradient-gold)",
                  transform: `translateZ(${spineDepth / 2}px)`,
                  boxShadow: "var(--shadow-gold)",
                }}
              >
                <div className="flex h-full flex-col justify-between p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary-foreground/70">
                    GranthAstraX Press
                  </p>
                  <div>
                    <p className="font-display text-2xl leading-tight text-primary-foreground">
                      Your Title Here
                    </p>
                    <p className="mt-2 text-[11px] text-primary-foreground/70">
                      Debarghya Bhowmick
                    </p>
                  </div>
                </div>
              </div>
              {/* Spine */}
              <div
                className="absolute left-0 top-0 h-full origin-left border-y border-gold/20 bg-surface-raised"
                style={{
                  width: spineDepth,
                  transform: `rotateY(-90deg) translateZ(${spineDepth / 2}px)`,
                }}
              />
              {/* Back cover */}
              <div
                className="absolute inset-0 rounded-l-sm border border-border bg-surface"
                style={{ transform: `translateZ(-${spineDepth / 2}px) rotateY(180deg)` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRotated((r) => !r)}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold"
          >
            <RotateCcw className="size-3.5" /> Rotate preview
          </button>
          <p className="pb-2 text-[11px] text-muted-foreground">
            Live 3D preview · spine scales with page count and stock
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl text-gold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}
