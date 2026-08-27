import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

const fonts = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Arial", value: "Arial, Helvetica, sans-serif" },
];

export function ResearchEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      TextStyle,
      FontFamily,
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[500px]",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* MS Word Style Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-4 py-2 sticky top-0 z-10">
        
        {/* Font Selector */}
        <Select
          onValueChange={(val) => editor.chain().focus().setFontFamily(val).run()}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Font Style" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((f) => (
              <SelectItem key={f.name} value={f.value} style={{ fontFamily: f.value }}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* Formatting */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={Bold}
          />
          <ToolbarButton
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={Italic}
          />
          <ToolbarButton
            isActive={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            icon={UnderlineIcon}
          />
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Alignment */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton
            isActive={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            icon={AlignLeft}
          />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            icon={AlignCenter}
          />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            icon={AlignRight}
          />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            icon={AlignJustify}
          />
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Lists */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <ToolbarButton
            isActive={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={List}
          />
          <ToolbarButton
            isActive={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={ListOrdered}
          />
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Image */}
        <ToolbarButton onClick={addImage} icon={ImageIcon} />
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-background p-8 lg:p-12">
        <div className="mx-auto max-w-[800px] min-h-[1056px] bg-card p-12 shadow-md ring-1 ring-border/50">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
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
