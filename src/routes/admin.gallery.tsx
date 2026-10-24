import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGalleryImages,
  insertGalleryImage,
  deleteGalleryImage,
  uploadImage,
} from "@/lib/supabase-service";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

function AdminGallery() {
  const queryClient = useQueryClient();
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [tag, setTag] = useState("Resort");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
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

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => uploadImage(file, "gallery-images", "gallery-images"),
  });

  const uploadMutation = useMutation({
    mutationFn: insertGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setSrc("");
      setAlt("");
      setImageFile(null);
      setImagePreview("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery"] }),
    onError: (error: any) => {
      toast.error(error?.message || "Unable to delete image. Please try again.");
    },
  });

  const selectedVisibleImageIds = images.map((image) => image.id);
  const allVisibleImagesSelected =
    images.length > 0 && selectedVisibleImageIds.every((id) => selectedImageIds.includes(id));

  const toggleImageSelection = (id: number) => {
    setSelectedImageIds((current) =>
      current.includes(id) ? current.filter((imageId) => imageId !== id) : [...current, id],
    );
  };

  const toggleSelectAllImages = () => {
    setSelectedImageIds((current) => {
      if (images.length === 0) return current;
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
      description: `This will permanently remove ${imageNames || "the selected image"}${extra} from the gallery and storage. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        try {
          setBulkDeletePending(true);
          await deleteSelectedMutation.mutateAsync(ids);
          setSelectedImageIds([]);
          toast.success(`Deleted ${ids.length} image${ids.length > 1 ? "s" : ""} successfully.`);
        } catch (error: any) {
          console.error("Gallery bulk delete failed:", error);
          toast.error(error?.message || "Unable to delete the selected images. Please try again.");
        } finally {
          setBulkDeletePending(false);
        }
      },
    });
  };

  const deleteSelectedMutation = useMutation({
    mutationFn: deleteGalleryImages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery"] }),
    onError: (error: any) => {
      toast.error(error?.message || "Image deletion failed. Please try again.");
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Management</p>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl text-forest-deep">Gallery</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the images displayed in the public gallery.
        </p>
      </div>

      <div className="bg-background border border-border p-6 shadow-sm">
        <h2 className="font-serif text-xl text-forest-deep mb-4">Add new image</h2>
        <form
          className="grid gap-4 sm:grid-cols-4 items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            let finalSrc = src;
            if (imageFile) {
              try {
                finalSrc = await uploadImageMutation.mutateAsync(imageFile);
              } catch (err: any) {
                console.error("Image upload failed:", err);
                toast.error("Image upload failed: " + (err?.message || "Unknown error"));
                return;
              }
            }
            if (finalSrc && alt && tag) uploadMutation.mutate({ src: finalSrc, alt, tag });
          }}
        >
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Upload Image or Paste URL
            </label>
            <div className="flex gap-2">
              <input
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold normal-case tracking-normal"
                placeholder="https://... (if not uploading)"
              />
              <label className="border border-dashed border-border px-3 py-2 cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground whitespace-nowrap flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      setSrc("");
                    }
                  }}
                  className="hidden"
                />
                Choose File
              </label>
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-full h-24 object-cover border border-border"
              />
            )}
          </div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Alt Text
            <input
              required
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold normal-case tracking-normal"
              placeholder="Description"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Category Tag
            <input
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold normal-case tracking-normal"
              placeholder="e.g. Resort, Dining"
            />
          </label>
          <button
            disabled={uploadMutation.isPending || uploadImageMutation.isPending}
            className="bg-forest-deep text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-gold transition h-9 mt-auto disabled:opacity-50"
          >
            {uploadMutation.isPending || uploadImageMutation.isPending ? "Adding..." : "Add Image"}
          </button>
        </form>
      </div>

      <div className="bg-background border border-border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-xl text-forest-deep">Existing Images</h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading images...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group overflow-hidden border border-border aspect-[3/4]"
                >
                  <div className="absolute left-3 top-3 z-10 rounded-md border border-white/60 bg-background/80 p-1 shadow-sm">
                    <input
                      type="checkbox"
                      checked={selectedImageIds.includes(img.id)}
                      onChange={() => toggleImageSelection(img.id)}
                      className="h-4 w-4 accent-forest-deep"
                      aria-label={`Select image ${img.alt}`}
                    />
                  </div>
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/90">
                      {img.tag}
                    </span>
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: `Delete Image`,
                          description: `This will permanently remove "${img.alt || "Untitled image"}" from the gallery and storage. This action cannot be undone.`,
                          onConfirm: () => {
                            deleteMutation.mutate(img.id);
                            setConfirmDialog((d) => ({ ...d, open: false }));
                          },
                        });
                      }}
                      className="bg-red-900/80 text-white p-2 rounded-full self-end hover:bg-red-800 transition backdrop-blur-sm"
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No images uploaded yet.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
              <label className="inline-flex items-center gap-3 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={images.length > 0 && allVisibleImagesSelected}
                  onChange={toggleSelectAllImages}
                  className="h-4 w-4 accent-forest-deep"
                  aria-label="Select all visible gallery images"
                />
                <span>Select all visible</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {selectedImageIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={deleteSelectedImages}
                  disabled={bulkDeletePending || selectedImageIds.length === 0}
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                >
                  {bulkDeletePending ? "Deleting..." : "Delete selected"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
