import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { BottomBar } from "./BottomBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TopNav />
      <BottomBar />
      <main className="pb-28">{children}</main>
    </div>
  );
}

