import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGalleryImages,
  insertGalleryImage,
  deleteGalleryImage,
  deleteGalleryImages,
  uploadImage,
} from "@/lib/supabase-service";
import {
  Trash2,
  Upload,
  Plus,
  Image as ImageIcon,
  X,
  Eye,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

const PRESET_CATEGORIES = ["Resort", "Rooms", "Dining", "Wellness", "Events"] as const;

type PendingFile = {
  id: string;
  file: File;
  preview: string;
};

function AdminGallery() {
  const queryClient = useQueryClient();
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [tag, setTag] = useState<string>("Resort");
  const [customTag, setCustomTag] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; tag: string } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image removed from gallery.");
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error?.message || "Unable to delete image. Please try again.");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: deleteGalleryImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (error: any) => {
      console.error("Bulk delete error:", error);
      toast.error(error?.message || "Image deletion failed. Please try again.");
    },
  });

  const handleFiles = (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) {
      toast.warning("Please select image files (.jpg, .png, .webp, .avif).");
      return;
    }

    const items: PendingFile[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setPendingFiles((prev) => [...prev, ...items]);
    setSrc("");
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const clearPendingFiles = () => {
    setPendingFiles([]);
    setSrc("");
    setAlt("");
  };

  const activeTag = customTag.trim() || tag;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingFiles.length && !src.trim()) {
      toast.warning("Please choose at least one image file or paste an image URL.");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    try {
      if (pendingFiles.length > 0) {
        // Upload each pending file
        for (let i = 0; i < pendingFiles.length; i++) {
          const item = pendingFiles[i];
          const fileAlt =
            alt.trim() ||
            item.file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") ||
            `${activeTag} photo ${i + 1}`;

          const uploadedUrl = await uploadImage(item.file, "oda web pictures", "gallery");
          await insertGalleryImage({
            src: uploadedUrl,
            alt: fileAlt,
            tag: activeTag,
          });
          successCount++;
        }
      } else if (src.trim()) {
        const directAlt = alt.trim() || `${activeTag} image`;
        await insertGalleryImage({
          src: src.trim(),
          alt: directAlt,
          tag: activeTag,
        });
        successCount++;
      }

      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success(
        successCount === 1
          ? "Image added to gallery successfully!"
          : `${successCount} images added to gallery successfully!`,
      );
      clearPendingFiles();
    } catch (err: any) {
      console.error("Gallery upload error:", err);
      toast.error(err?.message || "Failed to add image to gallery. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Categories present in the gallery
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = { all: images.length };
    for (const img of images) {
      const c = img.tag || "Uncategorized";
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [images]);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    for (const img of images) {
      if (img.tag) set.add(img.tag);
    }
    return Array.from(set);
  }, [images]);

  const filteredImages = useMemo(() => {
    if (activeCategoryFilter === "all") return images;
    return images.filter(
      (img) => (img.tag || "").toLowerCase() === activeCategoryFilter.toLowerCase(),
    );
  }, [images, activeCategoryFilter]);

  const selectedVisibleImageIds = filteredImages.map((image) => image.id);
  const allVisibleImagesSelected =
    filteredImages.length > 0 &&
    selectedVisibleImageIds.every((id) => selectedImageIds.includes(id));

  const toggleImageSelection = (id: number) => {
    setSelectedImageIds((current) =>
      current.includes(id) ? current.filter((imageId) => imageId !== id) : [...current, id],
    );
  };

  const toggleSelectAllImages = () => {
    setSelectedImageIds((current) => {
      if (filteredImages.length === 0) return current;
      const nextIds = new Set(current);
      if (allVisibleImagesSelected) {
        for (const id of selectedVisibleImageIds) nextIds.delete(id);
      } else {
        for (const id of selectedVisibleImageIds) nextIds.add(id);
      }
      return Array.from(nextIds);
    });
  };

  const deleteSelectedImages = async () => {
    const ids = images
      .filter((image) => selectedImageIds.includes(image.id))
      .map((image) => image.id);
    if (!ids.length) {
      toast.warning("Select at least one image before deleting.");
      return;
    }

    const imageNames = images
      .filter((image) => ids.includes(image.id))
      .map((image) => image.alt || "Untitled image")
      .slice(0, 3)
      .join(", ");
    const extra = ids.length > 3 ? ` and ${ids.length - 3} more image(s)` : "";

    setConfirmDialog({
      open: true,
      title: `Delete ${ids.length} Image${ids.length > 1 ? "s" : ""}`,
      description: `This will permanently remove ${imageNames || "the selected image"}${extra} from the gallery. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        try {
          setBulkDeletePending(true);
          await deleteSelectedMutation.mutateAsync(ids);
          setSelectedImageIds((prev) => prev.filter((id) => !ids.includes(id)));
          toast.success(`Deleted ${ids.length} image${ids.length > 1 ? "s" : ""} successfully.`);
        } catch (error: any) {
          console.error("Gallery bulk delete failed:", error);
          toast.error(error?.message || "Unable to delete selected images. Please try again.");
        } finally {
          setBulkDeletePending(false);
        }
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-semibold">Management</p>
          <h1 className="mt-2 font-serif text-3xl md:text-5xl text-forest-deep">Photo Gallery</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Upload and organize high-resolution resort photos displayed across the public gallery and homepage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-background/80 px-4 py-2.5 shadow-sm text-center">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Total Photos</span>
            <span className="font-serif text-2xl font-bold text-forest-deep">{images.length}</span>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-background border border-border p-6 shadow-sm rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gold/10 text-gold">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-forest-deep">Add New Photos</h2>
            <p className="text-xs text-muted-foreground">
              Select or drop one or multiple images, choose a category, and upload directly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category selection */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2 font-medium">
              1. Choose Category
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_CATEGORIES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTag(preset);
                    setCustomTag("");
                  }}
                  className={`px-4 py-2 text-xs uppercase tracking-wider rounded-md border transition-all ${
                    tag === preset && !customTag
                      ? "bg-forest-deep text-white border-forest-deep font-semibold shadow-sm"
                      : "bg-muted/30 text-forest-deep border-border hover:border-gold hover:text-gold"
                  }`}
                >
                  {preset}
                </button>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or custom category..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-gold rounded-md w-40"
                />
              </div>
            </div>
          </div>

          {/* Drag & drop or file upload area */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2 font-medium">
              2. Upload Images or Paste URL
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                isDragging
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/60 bg-muted/10"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-forest-deep/5 text-forest-deep">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-forest-deep">
                  Drag and drop images here, or{" "}
                  <label className="text-gold underline cursor-pointer hover:text-gold/80">
                    browse files
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFiles(e.target.files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WEBP, AVIF (Multiple images allowed)
                </p>
              </div>

              {/* Paste URL alternative */}
              <div className="mt-4 pt-4 border-t border-border/60 max-w-xl mx-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Or URL:</span>
                <input
                  type="url"
                  value={src}
                  onChange={(e) => {
                    setSrc(e.target.value);
                    if (e.target.value) setPendingFiles([]);
                  }}
                  className="flex-1 border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-gold rounded-md"
                  placeholder="https://example.com/resort-photo.jpg"
                />
              </div>
            </div>

            {/* Pending Files Preview Carousel */}
            {pendingFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Selected Photos ({pendingFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearPendingFiles}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {pendingFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-black/5"
                    >
                      <img
                        src={item.preview}
                        alt={`Pending ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingFile(item.id)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-destructive text-white rounded-full p-1 transition"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1.5 right-1.5 text-[9px] truncate text-white bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                        {item.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alt description input */}
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2 font-medium">
                3. Photo Description / Alt Text
              </label>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="w-full border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-gold rounded-md"
                placeholder={
                  pendingFiles.length > 1
                    ? "Leave blank to auto-name from filenames, or enter a description"
                    : "e.g. Sunset terrace with panoramic view of the Great Rift Valley"
                }
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || (!pendingFiles.length && !src.trim())}
              className="bg-forest-deep text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-gold transition font-semibold rounded-md flex items-center justify-center gap-2 h-10 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {pendingFiles.length > 1 ? `Upload ${pendingFiles.length} Photos` : "Add Photo"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery Browser Section */}
      <div className="bg-background border border-border p-6 shadow-sm rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl text-forest-deep">Current Gallery Photos</h2>
            <p className="text-xs text-muted-foreground">
              Filter by category, select photos to delete, or click to enlarge.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter("all")}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${
                activeCategoryFilter === "all"
                  ? "bg-forest-deep text-white font-medium shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              All ({images.length})
            </button>
            {PRESET_CATEGORIES.map((cat) => {
              const count = categoryStats[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${
                    activeCategoryFilter.toLowerCase() === cat.toLowerCase()
                      ? "bg-forest-deep text-white font-medium shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
            {/* Any other custom tags */}
            {uniqueTags
              .filter(
                (t) =>
                  !PRESET_CATEGORIES.map((p) => p.toLowerCase()).includes(t.toLowerCase()),
              )
              .map((customTag) => (
                <button
                  key={customTag}
                  type="button"
                  onClick={() => setActiveCategoryFilter(customTag)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${
                    activeCategoryFilter.toLowerCase() === customTag.toLowerCase()
                      ? "bg-forest-deep text-white font-medium shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {customTag} ({categoryStats[customTag] || 0})
                </button>
              ))}
          </div>
        </div>

        {/* Selection & Bulk Actions Bar */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-sm">
          <label className="inline-flex items-center gap-2.5 text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filteredImages.length > 0 && allVisibleImagesSelected}
              onChange={toggleSelectAllImages}
              className="h-4 w-4 accent-forest-deep rounded"
              aria-label="Select all visible gallery images"
            />
            <span className="text-xs uppercase tracking-wider font-medium">Select all in view</span>
          </label>

          <div className="flex items-center gap-3">
            {selectedImageIds.length > 0 && (
              <span className="text-xs uppercase tracking-[0.2em] text-forest-deep font-semibold">
                {selectedImageIds.length} selected
              </span>
            )}
            <button
              type="button"
              onClick={deleteSelectedImages}
              disabled={bulkDeletePending || selectedImageIds.length === 0}
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5"
            >
              <Trash2 className="h-3 w-3" />
              {bulkDeletePending ? "Deleting..." : "Delete selected"}
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-forest-deep border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading gallery images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-xl">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-forest-deep">No images in this category</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload photos above or select "All" to browse all categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img) => {
              const isSelected = selectedImageIds.includes(img.id);
              return (
                <div
                  key={img.id}
                  className={`group relative overflow-hidden rounded-lg border aspect-[4/3] bg-muted/20 transition-all ${
                    isSelected ? "ring-2 ring-forest-deep border-forest-deep" : "border-border hover:shadow-md"
                  }`}
                >
                  {/* Checkbox badge */}
                  <div className="absolute left-2.5 top-2.5 z-20">
                    <label className="flex items-center justify-center h-6 w-6 rounded bg-background/90 backdrop-blur-sm border border-border shadow-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleImageSelection(img.id)}
                        className="h-4 w-4 accent-forest-deep"
                        aria-label={`Select ${img.alt || "image"}`}
                      />
                    </label>
                  </div>

                  {/* Category tag chip */}
                  <div className="absolute right-2.5 top-2.5 z-20">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-forest-deep/85 text-white backdrop-blur-sm">
                      {img.tag}
                    </span>
                  </div>

                  {/* Image */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-10">
                    <p className="text-xs font-serif text-white line-clamp-2 mb-2">
                      {img.alt || "Untitled photo"}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/20">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(img)}
                        className="text-white/80 hover:text-white p-1 text-xs flex items-center gap-1 transition"
                        title="View photo"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Enlarge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: `Delete Image`,
                            description: `Are you sure you want to remove "${img.alt || "this image"}" from the gallery?`,
                            onConfirm: () => {
                              deleteMutation.mutate(img.id);
                              setConfirmDialog((d) => ({ ...d, open: false }));
                            },
                          });
                        }}
                        className="bg-destructive/80 hover:bg-destructive text-white p-1.5 rounded-full transition"
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                className="w-full max-h-[75vh] object-contain bg-black/95"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between gap-4 bg-background">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">
                  {lightboxImage.tag}
                </span>
                <h3 className="font-serif text-lg text-forest-deep">{lightboxImage.alt}</h3>
              </div>
              <a
                href={lightboxImage.src}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-wider text-forest-deep underline hover:text-gold"
              >
                Open Original
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
