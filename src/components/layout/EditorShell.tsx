import type { ReactNode } from "react";
import { EditorTopNav } from "./EditorTopNav";

export function EditorShell({ 
  children,
  title,
  onTitleChange
}: { 
  children: ReactNode;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
}) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <EditorTopNav title={title} onTitleChange={onTitleChange} />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
