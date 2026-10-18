import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================================================================
   1. Home Page Skeleton
   ========================================================================= */
export function HomePageSkeleton() {
  return (
    <AppShell>
      <div className="relative mx-auto max-w-7xl px-6 pt-12 pb-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <Skeleton className="h-7 w-48 rounded-full mb-6" variant="gold" glow />

          {/* Majestic display title */}
          <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
            <Skeleton className="h-12 sm:h-16 w-3/4 max-w-2xl rounded-xl" />
            <Skeleton className="h-12 sm:h-16 w-2/3 max-w-xl rounded-xl" />
          </div>

          {/* Subtitle */}
          <div className="mt-6 flex flex-col items-center gap-2 w-full max-w-xl">
            <Skeleton className="h-4 w-full rounded" variant="subtle" />
            <Skeleton className="h-4 w-5/6 rounded" variant="subtle" />
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Skeleton className="h-12 w-44 rounded-full" variant="gold" glow />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>

          {/* Hero Showcase Preview Mockup */}
          <div className="mt-14 w-full max-w-5xl rounded-2xl border border-border/60 bg-surface/40 p-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 px-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded-full" variant="subtle" />
                <Skeleton className="size-3 rounded-full" variant="subtle" />
                <Skeleton className="size-3 rounded-full" variant="subtle" />
                <Skeleton className="h-4 w-32 rounded ml-2" variant="subtle" />
              </div>
              <Skeleton className="h-4 w-20 rounded" variant="gold" />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 h-72 sm:h-96">
              <div className="md:col-span-4 flex flex-col gap-3 p-3">
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" variant="subtle" />
                <Skeleton className="h-3 w-4/5 rounded" variant="subtle" />
                <div className="mt-auto flex flex-col gap-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" variant="gold" />
                </div>
              </div>
              <div className="md:col-span-8 rounded-xl border border-border/40 p-6 flex flex-col items-center justify-center">
                <Skeleton className="size-20 rounded-2xl mb-4" variant="gold" glow />
                <Skeleton className="h-5 w-48 rounded mb-2" />
                <Skeleton className="h-3 w-64 rounded" variant="subtle" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Studios Grid */}
        <div className="mt-24">
          <div className="flex flex-col items-center text-center mb-12">
            <Skeleton className="h-6 w-32 rounded-full mb-3" variant="gold" />
            <Skeleton className="h-9 w-72 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-surface/30 p-6 flex flex-col gap-4"
              >
                <Skeleton className="size-12 rounded-xl" variant="gold" />
                <Skeleton className="h-6 w-3/4 rounded" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-full rounded" variant="subtle" />
                  <Skeleton className="h-3 w-5/6 rounded" variant="subtle" />
                  <Skeleton className="h-3 w-2/3 rounded" variant="subtle" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" variant="subtle" />
                  <Skeleton className="h-5 w-16 rounded-full" variant="subtle" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   2. Image Studio Skeleton
   ========================================================================= */
export function ImageStudioSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
        {/* Header */}
        <div className="mb-10">
          <Skeleton className="h-5 w-28 rounded-full mb-3" variant="gold" />
          <Skeleton className="h-10 w-64 rounded-xl mb-2" />
          <Skeleton className="h-4 w-96 max-w-full rounded" variant="subtle" />
        </div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Dropzone & Preview (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Big Dropzone Card */}
            <div className="rounded-xl border border-dashed border-border/80 bg-surface/30 p-12 flex flex-col items-center justify-center text-center">
              <Skeleton className="size-16 rounded-full mb-5" variant="gold" glow />
              <Skeleton className="h-6 w-48 rounded mb-2" />
              <Skeleton className="h-3.5 w-80 max-w-full rounded mb-6" variant="subtle" />
              
              {/* Format badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {["WEBP", "AVIF", "PNG", "JPG", "TIFF", "SVG", "PDF"].map((fmt) => (
                  <Skeleton key={fmt} className="h-6 w-12 rounded" variant="subtle" />
                ))}
              </div>

              <Skeleton className="h-10 w-40 rounded-lg" variant="gold" />
            </div>

            {/* Output history / capabilities card */}
            <div className="rounded-xl border border-border/50 bg-surface/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-4 w-20 rounded" variant="subtle" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-border/40 p-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-20 rounded" variant="gold" />
                    <Skeleton className="h-3 w-full rounded" variant="subtle" />
                    <Skeleton className="h-3 w-4/5 rounded" variant="subtle" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Parameters Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="rounded-xl border border-border/60 bg-surface/40 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="size-6 rounded-md" variant="subtle" />
              </div>

              {/* Format Select */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 rounded" variant="subtle" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Quality Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" variant="subtle" />
                  <Skeleton className="h-4 w-10 rounded" variant="gold" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>

              {/* Scale Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" variant="subtle" />
                  <Skeleton className="h-4 w-8 rounded" variant="gold" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>

              {/* Process Button */}
              <Skeleton className="h-12 w-full rounded-lg mt-2" variant="gold" glow />
            </div>

            {/* Specs banner */}
            <div className="rounded-xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-2.5">
              <Skeleton className="h-4 w-28 rounded" variant="gold" />
              <Skeleton className="h-3 w-full rounded" variant="subtle" />
              <Skeleton className="h-3 w-5/6 rounded" variant="subtle" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   3. Document Studio Skeleton
   ========================================================================= */
export function DocumentStudioSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-5 w-32 rounded-full mb-3" variant="gold" />
          <Skeleton className="h-10 w-72 rounded-xl mb-2" />
          <Skeleton className="h-4 w-96 max-w-full rounded" variant="subtle" />
        </div>

        {/* Mode Toggles Bar */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/40 px-5 py-3">
              <Skeleton className="size-5 rounded" variant="gold" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-3 w-32 rounded" variant="subtle" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full ml-2" variant="subtle" />
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Dropzone & Pipeline (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-xl border border-dashed border-border/80 bg-surface/30 p-12 flex flex-col items-center justify-center text-center">
              <Skeleton className="size-16 rounded-full mb-5" variant="gold" glow />
              <Skeleton className="h-6 w-56 rounded mb-2" />
              <Skeleton className="h-3.5 w-80 max-w-full rounded mb-6" variant="subtle" />
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {["PDF", "DOCX", "EPUB", "TEX", "HTML", "TXT"].map((fmt) => (
                  <Skeleton key={fmt} className="h-6 w-14 rounded" variant="subtle" />
                ))}
              </div>

              <Skeleton className="h-10 w-44 rounded-lg" variant="gold" />
            </div>

            {/* Feature Capabilities Grid */}
            <div className="rounded-xl border border-border/50 bg-surface/20 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="size-8 rounded-lg" variant="gold" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-full rounded" variant="subtle" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Configuration (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="rounded-xl border border-border/60 bg-surface/40 p-6 flex flex-col gap-5">
              <Skeleton className="h-5 w-36 rounded border-b border-border/40 pb-3" />

              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 rounded" variant="subtle" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28 rounded" variant="subtle" />
                  <Skeleton className="h-4 w-12 rounded" variant="gold" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" variant="subtle" />
                  <Skeleton className="h-4 w-14 rounded" variant="gold" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>

              <Skeleton className="h-12 w-full rounded-lg mt-3" variant="gold" glow />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   4. Writer Desk Skeleton
   ========================================================================= */
export function WriterDeskSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-5 w-28 rounded-full mb-3" variant="gold" />
          <Skeleton className="h-10 w-64 rounded-xl mb-2" />
          <Skeleton className="h-4 w-96 max-w-full rounded" variant="subtle" />
        </div>

        {/* Step Progress Wizard Bar */}
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "01", label: "Trim & Paper" },
            { step: "02", label: "Metadata & Barcode" },
            { step: "03", label: "3D Preview & Export" },
          ].map((item, idx) => (
            <div
              key={item.step}
              className={`rounded-xl border p-4 flex items-center gap-3 ${
                idx === 0
                  ? "border-gold/40 bg-gold/5"
                  : "border-border/50 bg-surface/30"
              }`}
            >
              <Skeleton className="size-8 rounded-full" variant={idx === 0 ? "gold" : "subtle"} />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-10 rounded" variant="gold" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Configuration Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-xl border border-border/60 bg-surface/40 p-6 flex flex-col gap-5">
              <Skeleton className="h-5 w-32 rounded" />

              {/* Book Size Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-secondary/30 p-3 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-3 w-16 rounded" variant="subtle" />
                  </div>
                ))}
              </div>

              {/* Page count & Paper weight inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20 rounded" variant="subtle" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20 rounded" variant="subtle" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              {/* Spine Calculation Summary Card */}
              <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-28 rounded" variant="gold" />
                  <Skeleton className="h-6 w-20 rounded" variant="gold" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" variant="gold" />
              </div>
            </div>
          </div>

          {/* Right 3D Viewport Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative rounded-2xl border border-border/70 bg-gradient-to-b from-surface/60 to-surface/20 p-6 min-h-[460px] flex flex-col justify-between overflow-hidden shadow-2xl">
              {/* Top Viewport Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-20 rounded-md" variant="subtle" />
                  <Skeleton className="h-7 w-20 rounded-md" variant="subtle" />
                </div>
                <Skeleton className="h-7 w-28 rounded-md" variant="gold" />
              </div>

              {/* Center 3D Book Silhouette Silhouette */}
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Skeleton className="h-64 w-48 rounded-r-lg shadow-2xl" variant="gold" glow />
                  <div className="absolute -left-3 top-0 bottom-0 w-3 rounded-l bg-white/10" />
                </div>
                <Skeleton className="h-4 w-40 rounded-full mt-8" variant="subtle" />
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex gap-2">
                  <Skeleton className="size-9 rounded-md" variant="subtle" />
                  <Skeleton className="size-9 rounded-md" variant="subtle" />
                  <Skeleton className="size-9 rounded-md" variant="subtle" />
                </div>
                <Skeleton className="h-10 w-36 rounded-lg" variant="gold" glow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   5. Research Desk Skeleton (Project List)
   ========================================================================= */
export function ResearchDeskSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <Skeleton className="h-5 w-28 rounded-full mb-3" variant="gold" />
            <Skeleton className="h-10 w-72 rounded-xl mb-2" />
            <Skeleton className="h-4 w-96 max-w-full rounded" variant="subtle" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full shrink-0" variant="gold" glow />
        </div>

        {/* Projects Table Card */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/30 backdrop-blur-md">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-surface/50">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" variant="subtle" />
            <Skeleton className="h-4 w-16 rounded ml-auto" variant="subtle" />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-surface/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" variant="gold" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4.5 w-60 sm:w-80 rounded" />
                    <Skeleton className="h-3 w-32 rounded" variant="subtle" />
                  </div>
                </div>

                <div className="hidden sm:block">
                  <Skeleton className="h-3.5 w-24 rounded" variant="subtle" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16 rounded-md" variant="subtle" />
                  <Skeleton className="size-8 rounded-md" variant="subtle" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   6. Research Workspace Skeleton (IDE)
   ========================================================================= */
export function ResearchWorkspaceSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Navbar */}
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-background/95 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" variant="gold" />
          <Skeleton className="h-4 w-24 rounded hidden sm:block" />
        </div>

        {/* Project Title Placeholder */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-56 sm:w-80 rounded-md" />
          <Skeleton className="h-4 w-16 rounded hidden md:block" variant="subtle" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" variant="subtle" />
          <Skeleton className="h-8 w-24 rounded-md" variant="gold" glow />
          <Skeleton className="size-8 rounded-full ml-1" variant="subtle" />
        </div>
      </header>

      {/* Main Workspace 3-Pane Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Files / Assets) */}
        <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface/30 p-3 gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="size-5 rounded" variant="subtle" />
          </div>

          {/* File items */}
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-md bg-secondary/30">
                <Skeleton className="size-4 rounded" variant="gold" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
            ))}
          </div>

          {/* Images Section */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16 rounded" variant="subtle" />
              <Skeleton className="h-5 w-14 rounded" variant="subtle" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 rounded-md" variant="subtle" />
              <Skeleton className="h-16 rounded-md" variant="subtle" />
            </div>
          </div>
        </div>

        {/* Center Code Editor Pane */}
        <div className="flex-1 flex flex-col border-r border-border bg-[#141414]/90 p-4 overflow-hidden">
          {/* Sub-toolbar */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded" variant="gold" />
              <Skeleton className="h-4 w-16 rounded" variant="subtle" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded" variant="subtle" />
              <Skeleton className="h-7 w-24 rounded" variant="gold" />
            </div>
          </div>

          {/* Editor Lines Skeleton */}
          <div className="flex flex-col gap-2.5 font-mono">
            {[
              "w-48", "w-72", "w-36", "w-96", "w-64", "w-80", "w-40",
              "w-2/3", "w-1/2", "w-5/6", "w-1/3", "w-3/4", "w-2/5"
            ].map((widthClass, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground/30 font-mono w-6 text-right">
                  {idx + 1}
                </span>
                <Skeleton className={`h-4 ${widthClass} rounded`} variant={idx % 3 === 0 ? "gold" : "subtle"} />
              </div>
            ))}
          </div>
        </div>

        {/* Right PDF Preview Pane */}
        <div className="hidden lg:flex w-[45%] shrink-0 flex-col bg-surface/20 p-4">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24 rounded" variant="subtle" />
              <Skeleton className="h-7 w-16 rounded" variant="subtle" />
            </div>
            <Skeleton className="h-7 w-28 rounded" variant="gold" />
          </div>

          {/* Simulated PDF Paper Canvas */}
          <div className="flex-1 flex justify-center items-center p-4">
            <div className="w-full max-w-md h-[90%] rounded-lg border border-border/60 bg-surface/50 p-6 flex flex-col gap-4 shadow-2xl">
              <Skeleton className="h-6 w-3/4 mx-auto rounded" />
              <Skeleton className="h-3 w-1/2 mx-auto rounded" variant="subtle" />
              <div className="mt-4 flex flex-col gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-2.5 w-full rounded" variant="subtle" />
                ))}
              </div>
              <Skeleton className="h-28 w-full rounded-lg mt-2" variant="subtle" />
              <div className="flex flex-col gap-2 mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-2.5 w-full rounded" variant="subtle" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
