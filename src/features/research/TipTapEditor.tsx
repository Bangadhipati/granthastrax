import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { useEffect, useState } from 'react'
import { generateLatex } from '@/lib/latex-generator'
import {
  Bold, Italic, Underline as UnderlineIcon, AlignCenter, AlignLeft, AlignRight,
  List, ListOrdered, Image as ImageIcon, Table as TableIcon, Heading1, Heading2, Heading3
} from "lucide-react";

interface TipTapEditorProps {
  initialContent?: string;
  onUpdate: (json: JSONContent, latex: string) => void;
}

export function TipTapEditor({ initialContent, onUpdate }: TipTapEditorProps) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Underline,
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent ? JSON.parse(initialContent) : `<h1>New Document</h1><p>Start writing here...</p>`,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const latex = generateLatex(json);
      onUpdate(json, latex);
    },
  })

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) return null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Editor Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-center gap-1.5 border-b border-border bg-background/50 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} isActive={editor.isActive('heading', { level: 1 })} />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} isActive={editor.isActive('heading', { level: 2 })} />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} isActive={editor.isActive('heading', { level: 3 })} />
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} isActive={editor.isActive('bold')} />
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} isActive={editor.isActive('italic')} />
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} isActive={editor.isActive('underline')} />
        </div>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={AlignLeft} isActive={editor.isActive({ textAlign: 'left' })} />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} isActive={editor.isActive({ textAlign: 'center' })} />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={AlignRight} isActive={editor.isActive({ textAlign: 'right' })} />
        </div>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} isActive={editor.isActive('bulletList')} />
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} isActive={editor.isActive('orderedList')} />
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton onClick={() => {
            const url = window.prompt('URL');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }} icon={ImageIcon} />
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={TableIcon} />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-8 lg:p-12 flex justify-center items-start">
        <div className="bg-white text-black w-full max-w-[800px] min-h-[1056px] shadow-2xl p-12 lg:p-16">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  isActive = false,
  onClick,
  icon: Icon,
}: {
  isActive?: boolean;
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-7 place-items-center rounded text-muted-foreground transition-colors ${
        isActive ? "bg-accent text-gold" : "hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" strokeWidth={1.7} />
    </button>
  );
}
