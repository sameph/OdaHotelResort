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
import { logActivity } from "@/lib/activity-logger.server";
import { Trash2 } from "lucide-react";
import { useAdminRole } from "./admin";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

function AdminGallery() {
  const role = useAdminRole();
  const queryClient = useQueryClient();
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [tag, setTag] = useState("Resort");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => uploadImage(file, "gallery-images", "gallery-images"),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { src: string; alt: string; tag: string }) => {
      const result = await insertGalleryImage(data);
      // Log the upload
      try {
        await logActivity({
          data: {
            action: "upload",
            resource_type: "gallery_image",
            resource_id: String(result.id),
            resource_name: data.alt || "Gallery Image",
            details: { tag: data.tag },
          },
        });
      } catch (err) {
        console.warn("Failed to log upload activity:", err);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setSrc("");
      setAlt("");
      setImageFile(null);
      setImagePreview("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteGalleryImage(id);
      // Log the delete
      try {
        await logActivity({
          data: {
            action: "delete",
            resource_type: "gallery_image",
            resource_id: String(id),
          },
        });
      } catch (err) {
        console.warn("Failed to log delete activity:", err);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery"] }),
  });

  if (role === "receptionist") {
    return (
      <div className="p-16 text-center text-muted-foreground">
        Unauthorized access. Only administrators can manage the Gallery.
      </div>
    );
  }

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

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading images...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group overflow-hidden border border-border aspect-3/4"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <span className="text-[10px] uppercase tracking-widest text-white/90">
                  {img.tag}
                </span>
                <button
                  onClick={() => deleteMutation.mutate(img.id)}
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
      )}
    </div>
  );
}
