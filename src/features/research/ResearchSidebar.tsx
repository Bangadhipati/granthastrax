import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  UploadCloud, FileText, ImageIcon, Loader2, Edit2, 
  Check, X, Plus, Hash, BookOpen, FileCode, Trash2 
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface ProjectImage {
  _id: string;
  name: string;
  url: string;
  publicId: string;
}

export interface ProjectFile {
  _id: string;
  name: string;
  content: string;
}

function getDefaultContentForFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.bib')) {
    return `@article{sample2026,
  author = {Author, A.},
  title = {Title of Reference},
  journal = {Journal of Research},
  year = {2026},
  volume = {1},
  pages = {1--10}
}\n`;
  }
  if (lower.endsWith('.sty')) {
    return `\\NeedsTeXFormat{LaTeX2e}
\\ProvidesPackage{${lower.replace(/\.sty$/, '')}}[2026/01/01 Custom Package]

% Package macros and styling definitions
\n`;
  }
  if (lower.endsWith('.tex')) {
    return `% ${filename} - Subfile
\\section{${filename.replace(/\.tex$/, '')}}
Enter content here...
\n`;
  }
  return "";
}

export function ResearchSidebar({ 
  projectId, 
  project, 
  latexContent,
  onInsertImage,
  activeView,
  onSelectMain,
  onSelectImage,
  onSelectFile,
}: { 
  projectId: string;
  project: any;
  latexContent: string;
  onInsertImage: (url: string, name: string) => void;
  activeView?: { type: 'main' } | { type: 'file'; fileId: string } | { type: 'image'; imageId: string };
  onSelectMain?: () => void;
  onSelectImage?: (image: ProjectImage) => void;
  onSelectFile?: (file: ProjectFile) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editImageName, setEditImageName] = useState("");

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const images: ProjectImage[] = project?.images || [];
  const files: ProjectFile[] = project?.files || [];

  const outline = latexContent
    .split("\n")
    .map(line => {
      const match = line.match(/\\(section|subsection|subsubsection)\{([^}]+)\}/);
      if (match) return match[2];
      return null;
    })
    .filter(Boolean) as string[];
  const displayOutline = outline.length > 0 ? outline : ["Abstract", "Introduction"];

  const addImageMutation = useMutation({
    mutationFn: async (payload: { name: string, url: string, publicId: string } | Array<{ name: string, url: string, publicId: string }>) => {
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

  const renameFileMutation = useMutation({
    mutationFn: async (payload: { fileId: string; name: string }) => {
      const res = await api.put(`/api/projects/${projectId}/files/${payload.fileId}`, { name: payload.name });
      return res.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', projectId], updatedProject);
      setEditingFileId(null);
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await api.delete(`/api/projects/${projectId}/files/${fileId}`);
      return res.data;
    },
    onSuccess: (updatedProject, fileId) => {
      queryClient.setQueryData(['project', projectId], updatedProject);
      if (activeView?.type === 'file' && activeView.fileId === fileId) {
        onSelectMain?.();
      }
    }
  });

  const handleConfirmCreateFile = async () => {
    let name = newFileName.trim();
    if (!name) {
      setIsCreatingFile(false);
      return;
    }
    if (!name.includes('.')) {
      name += '.tex';
    }
    if (name.toLowerCase() === 'main.tex') {
      alert("main.tex already exists as the root document.");
      return;
    }
    const existing = files.some((f: any) => f.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      alert(`A file named "${name}" already exists.`);
      return;
    }

    const starterContent = getDefaultContentForFilename(name);
    try {
      const res = await api.post(`/api/projects/${projectId}/files`, { name, content: starterContent });
      queryClient.setQueryData(['project', projectId], res.data);
      setIsCreatingFile(false);
      setNewFileName("");
      const created = (res.data?.files || []).find((f: any) => f.name.toLowerCase() === name.toLowerCase());
      if (created && onSelectFile) {
        onSelectFile(created);
      }
    } catch (err: any) {
      alert("Failed to create file: " + (err.response?.data?.error || err.message));
    }
  };

  const handleConfirmRename = (fileId: string) => {
    let name = editFileName.trim();
    if (!name) return;
    if (name.toLowerCase() === 'main.tex') {
      alert("Cannot rename a file to main.tex");
      return;
    }
    renameFileMutation.mutate({ fileId, name });
  };

  const handleTextFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const uploadedFileList = Array.from(fileList);

    setIsUploadingFiles(true);
    try {
      const filePayloads: Array<{ name: string; content: string }> = [];
      for (const file of uploadedFileList) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || "");
          reader.onerror = reject;
          reader.readAsText(file);
        });
        filePayloads.push({ name: file.name, content: text });
      }

      if (filePayloads.length > 0) {
        const res = await api.post(`/api/projects/${projectId}/files`, filePayloads);
        queryClient.setQueryData(['project', projectId], res.data);
        const updatedFiles: ProjectFile[] = res.data?.files || [];
        const firstPayload = filePayloads[0];
        if (firstPayload && onSelectFile) {
          const match = updatedFiles.find(f => f.name.toLowerCase() === firstPayload.name.toLowerCase());
          if (match) {
            onSelectFile(match);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to upload files:", err);
      alert("Failed to upload files: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUploadingFiles(false);
      if (fileUploadRef.current) fileUploadRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials are not configured in the .env file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const uploadedAssets: Array<{ name: string; url: string; publicId: string }> = [];
    let completedCount = 0;

    await Promise.allSettled(
      files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.secure_url) {
            uploadedAssets.push({
              name: file.name,
              url: data.secure_url,
              publicId: data.public_id || ''
            });
          } else {
            console.error(`Upload error for ${file.name}:`, data.error?.message);
          }
        } catch (err) {
          console.error(`Network error uploading ${file.name}:`, err);
        } finally {
          completedCount++;
          setUploadProgress({ current: completedCount, total: files.length });
        }
      })
    );

    if (uploadedAssets.length > 0) {
      addImageMutation.mutate(uploadedAssets);
    } else {
      alert("Upload failed. Please check your network connection and Cloudinary settings.");
    }

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              {/* Action Toolbar: New File & Upload with clean icons */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Files</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingFile(true);
                      setNewFileName("");
                    }}
                    title="Create new file (.tex, .bib, .sty...)"
                    className="inline-flex items-center gap-1 rounded border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:border-gold/50 hover:bg-secondary hover:text-gold"
                  >
                    <Plus className="size-3 text-gold" />
                    <span>New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    disabled={isUploadingFiles}
                    title="Upload files (.tex, .bib, .sty, .cls, .txt...)"
                    className="inline-flex items-center gap-1 rounded border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:border-gold/50 hover:bg-secondary hover:text-gold disabled:opacity-50"
                  >
                    {isUploadingFiles ? <Loader2 className="size-3 animate-spin text-gold" /> : <UploadCloud className="size-3 text-gold" />}
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileUploadRef}
                onChange={handleTextFileUpload}
                accept=".tex,.bib,.sty,.cls,.txt,.bbl,.bst"
                multiple
                className="hidden"
              />

              <ul className="space-y-1">
                {/* Root main.tex */}
                <li 
                  onClick={onSelectMain}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200 border",
                    activeView?.type === 'main'
                      ? "bg-gold/15 text-gold border-gold/40 font-semibold shadow-sm"
                      : "bg-secondary/40 text-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="size-3.5 text-gold shrink-0" />
                    <span className="truncate">main.tex</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 bg-background/50 px-1 py-0.5 rounded font-mono">
                    root
                  </span>
                </li>

                {/* Inline New File input */}
                {isCreatingFile && (
                  <li className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-secondary/60 border border-gold/50 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                    <FileText className="size-3.5 text-gold shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. references.bib"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmCreateFile();
                        if (e.key === "Escape") setIsCreatingFile(false);
                      }}
                      className="flex-1 min-w-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmCreateFile}
                      className="p-0.5 rounded text-gold hover:text-gold/80 transition-colors"
                      title="Save file"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFile(false)}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Cancel"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                )}

                {/* Auxiliary files list */}
                {files.map((file: ProjectFile) => {
                  const isSelected = activeView?.type === 'file' && activeView.fileId === file._id;
                  const isEditing = editingFileId === file._id;

                  return (
                    <li
                      key={file._id}
                      onClick={() => onSelectFile?.(file)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs transition-all duration-200 border",
                        isSelected
                          ? "bg-gold/15 text-gold border-gold/40 font-semibold shadow-sm"
                          : "bg-secondary/40 text-foreground border-transparent hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            type="text"
                            value={editFileName}
                            onChange={(e) => setEditFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleConfirmRename(file._id);
                              if (e.key === "Escape") setEditingFileId(null);
                            }}
                            className="flex-1 min-w-0 rounded bg-background px-1.5 py-0.5 text-xs text-foreground border border-gold/40 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmRename(file._id)}
                            className="p-1 text-gold hover:opacity-80"
                            title="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFileId(null)}
                            className="p-1 text-muted-foreground hover:opacity-80"
                            title="Cancel"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 truncate">
                            {file.name.endsWith('.bib') ? (
                              <BookOpen className="size-3.5 text-amber-400 shrink-0" />
                            ) : file.name.endsWith('.sty') || file.name.endsWith('.cls') ? (
                              <FileCode className="size-3.5 text-blue-400 shrink-0" />
                            ) : (
                              <FileText className="size-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate" title={file.name}>{file.name}</span>
                          </div>

                          <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFileId(file._id);
                                setEditFileName(file.name);
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                              title="Rename file"
                            >
                              <Edit2 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                  deleteFileMutation.mutate(file._id);
                                }
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-background hover:text-red-400 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
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
                multiple
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-gold" />
                    <span>
                      {uploadProgress 
                        ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...` 
                        : "Uploading..."}
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4" />
                    <span>Upload Images</span>
                  </>
                )}
              </button>

              <ul className="space-y-2">
                {images.map((img) => {
                  const isSelected = activeView?.type === 'image' && activeView.imageId === img._id;
                  return (
                    <li 
                      key={img._id} 
                      onClick={() => onSelectImage?.(img)}
                      className={cn(
                        "group flex flex-col gap-1 rounded-md px-2 py-1.5 text-xs transition-all duration-200 cursor-pointer border",
                        isSelected
                          ? "bg-gold/15 text-gold border-gold/40 font-medium shadow-sm"
                          : "border-transparent hover:bg-secondary/40 text-foreground"
                      )}
                    >
                      {editingImageId === img._id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <div 
                              className={cn(
                                "size-5 rounded overflow-hidden shrink-0 border transition-colors inline-flex items-center justify-center bg-black/40",
                                isSelected ? "border-gold" : "border-border"
                              )}
                            >
                              <img src={img.url} alt={img.name} className="size-full object-cover" />
                            </div>
                            <span 
                              className={cn("truncate select-text", isSelected ? "text-gold font-medium" : "text-muted-foreground")} 
                              title={img.name}
                            >
                              {img.name}
                            </span>
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={() => onInsertImage(img.url, img.name)} 
                              className="p-1 text-muted-foreground hover:text-gold" 
                              title="Insert \includegraphics code at cursor"
                            >
                              <Plus className="size-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => startEditing(img)} 
                              className="p-1 text-muted-foreground hover:text-foreground" 
                              title="Rename"
                            >
                              <Edit2 className="size-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => deleteImageMutation.mutate(img._id)} 
                              className="p-1 text-muted-foreground hover:text-red-500" 
                              title="Delete"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
                {images.length === 0 && !isUploading && (
                  <li className="text-[10px] text-muted-foreground/60 text-center py-2">No images uploaded</li>
                )}
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
        </Accordion>
      </div>
    </aside>
  );
}
