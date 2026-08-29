import { useState } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Folder, Hash, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ResearchSidebar({ latexContent = "" }: { latexContent?: string }) {
  const [compiler, setCompiler] = useState("pdfLaTeX");

  const outline = latexContent
    .split("\n")
    .map(line => {
      const match = line.match(/\\(section|subsection|subsubsection)\{([^}]+)\}/);
      if (match) return match[2];
      return null;
    })
    .filter(Boolean) as string[];

  // Fallback to Abstract/Intro if empty
  const displayOutline = outline.length > 0 ? outline : ["Abstract", "Introduction"];


  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card/30 relative">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Project Assets
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["files", "outline"]} className="w-full">
        {/* File Tree Section */}
        <AccordionItem value="files" className="border-b-0 px-4">
          <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
            File Tree
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-1">
            <button
              type="button"
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <UploadCloud className="size-4" />
              <span>Upload files</span>
            </button>
            <ul className="space-y-1">
              <li className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground opacity-50">
                <Folder className="size-3.5 text-gold/80" />
                <span>figures (coming soon)</span>
              </li>
              <li className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary/60 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <FileText className="size-3.5" />
                <span>main.tex</span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Outline Section */}
        <AccordionItem value="outline" className="border-b-0 px-4">
          <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
            Outline
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <ul className="space-y-1">
              {displayOutline.map(
                (heading) => (
                  <li
                    key={heading}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Hash className="size-3 text-gold/50" />
                    <span className="truncate">{heading}</span>
                  </li>
                )
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
      
      {/* Footer Settings */}
      <div className="sticky bottom-0 border-t border-border bg-card/80 p-3 backdrop-blur-md">
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Settings className="size-4 text-gold/80" />
              <span>Settings</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
              <DialogDescription>
                Select your preferred LaTeX compiler. (Note: True compilation requires a backend server).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">Compiler Engine</label>
                <Select value={compiler} onValueChange={setCompiler}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a compiler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdfLaTeX">pdfLaTeX</SelectItem>
                    <SelectItem value="LaTeX">LaTeX</SelectItem>
                    <SelectItem value="XeLaTeX">XeLaTeX</SelectItem>
                    <SelectItem value="LuaLaTeX">LuaLaTeX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
