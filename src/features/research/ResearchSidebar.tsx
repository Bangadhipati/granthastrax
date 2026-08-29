import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, ImageIcon, Settings, Loader2, Edit2, Check, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api } from "@/lib/api";

interface ProjectImage {
  _id: string;
  name: string;
  url: string;
  publicId: string;
}

export function ResearchSidebar({ 
  projectId, 
  project, 
  latexContent,
  onCompilerChange,
  onInsertImage
}: { 
  projectId: string;
  project: any;
  latexContent: string;
  onCompilerChange: (compiler: string) => void;
  onInsertImage: (url: string, name: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editImageName, setEditImageName] = useState("");

  const compiler = project?.compiler || 'pdflatex';
  const images: ProjectImage[] = project?.images || [];

  const outline = latexContent
    .split("\n")
    .map(line => {
      const match = line.match(/\\(section|subsection|subsubsection)\{([^}]+)\}/);
      if (match) return match[2];
      return null;
    })
    .filter(Boolean) as string[];
  const displayOutline = outline.length > 0 ? outline : ["Abstract", "Introduction"];

  const handleCompilerChange = (val: string) => {
    onCompilerChange(val);
  };

  const addImageMutation = useMutation({
    mutationFn: async (payload: { name: string, url: string, publicId: string }) => {
      const res = await api.post(`/api/projects/${projectId}/images`, payload);
      return res.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', projectId], updatedProject);
    }
  });

  const renameImageMutation = useMutation({
    mutationFn: async (payload: { imageId: string, name: string }) => {
      const res = await api.put(`/api/projects/${projectId}/images/${payload.imageId}`, { name: payload.name });
      return res.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', projectId], updatedProject);
      setEditingImageId(null);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await api.delete(`/api/projects/${projectId}/images/${imageId}`);
      return res.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', projectId], updatedProject);
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials are not configured in the .env file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        addImageMutation.mutate({
          name: file.name,
          url: data.secure_url,
          publicId: data.public_id
        });
      } else {
        alert("Upload failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed to connect to Cloudinary.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEditing = (img: ProjectImage) => {
    setEditingImageId(img._id);
    setEditImageName(img.name);
  };

  const saveEditing = (imgId: string) => {
    if (!editImageName.trim()) return;
    renameImageMutation.mutate({ imageId: imgId, name: editImageName });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card/30 relative">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Project Workspace
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["files", "outline", "images"]} className="w-full">
          {/* File Tree Section */}
          <AccordionItem value="files" className="border-b-0 px-4">
            <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
              File Tree
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-1">
              <ul className="space-y-1">
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
                {displayOutline.map((heading, i) => (
                  <li
                    key={i}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Hash className="size-3 text-gold/50" />
                    <span className="truncate">{heading}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Image Manager Section */}
          <AccordionItem value="images" className="border-b-0 px-4">
            <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
              Images
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                <span>Upload Image</span>
              </button>

              <ul className="space-y-2">
                {images.map((img) => (
                  <li key={img._id} className="group flex flex-col gap-1 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-secondary/40">
                    {editingImageId === img._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editImageName}
                          onChange={(e) => setEditImageName(e.target.value)}
                          className="w-full bg-background border border-border rounded px-1 py-0.5 text-xs text-foreground focus:outline-none focus:border-gold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(img._id);
                            if (e.key === 'Escape') setEditingImageId(null);
                          }}
                        />
                        <button onClick={() => saveEditing(img._id)} className="text-green-500 hover:text-green-400 p-0.5"><Check className="size-3" /></button>
                        <button onClick={() => setEditingImageId(null)} className="text-red-500 hover:text-red-400 p-0.5"><X className="size-3" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1" onClick={() => onInsertImage(img.url, img.name)}>
                          <img src={img.url} alt={img.name} className="size-5 rounded object-cover" />
                          <span className="truncate text-muted-foreground hover:text-foreground">{img.name}</span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onInsertImage(img.url, img.name)} className="p-1 text-muted-foreground hover:text-gold" title="Insert at cursor">
                            <Plus className="size-3" />
                          </button>
                          <button onClick={() => startEditing(img)} className="p-1 text-muted-foreground hover:text-foreground" title="Rename">
                            <Edit2 className="size-3" />
                          </button>
                          <button onClick={() => deleteImageMutation.mutate(img._id)} className="p-1 text-muted-foreground hover:text-red-500" title="Delete">
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {images.length === 0 && !isUploading && (
                  <li className="text-[10px] text-muted-foreground/60 text-center py-2">No images uploaded</li>
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
              <span>Project Settings</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
              <DialogDescription>
                Configure the LaTeX compilation engine.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">Compiler Engine</label>
                <Select value={compiler} onValueChange={handleCompilerChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a compiler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdflatex">pdfLaTeX</SelectItem>
                    <SelectItem value="xelatex">XeLaTeX</SelectItem>
                    <SelectItem value="lualatex">LuaLaTeX</SelectItem>
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
