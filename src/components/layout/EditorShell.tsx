import type { ReactNode } from "react";
import { EditorTopNav } from "./EditorTopNav";

export function EditorShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <EditorTopNav />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
