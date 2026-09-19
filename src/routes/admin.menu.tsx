import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { Check, Plus, UploadCloud, UtensilsCrossed, X } from "lucide-react";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
  uploadImage,
} from "@/lib/supabase-service";
import type { MenuItemInsert, MenuItemRow } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/menu")({
  component: MenuAdminPage,
});

const emptyForm = (): MenuItemInsert => ({
  category: "Starters",
  title: "",
  description: "",
  price: "",
  allergens: [],
  featured: false,
  image_url: "",
});

function MenuAdminPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuItemInsert>(emptyForm());
  const [allergenInput, setAllergenInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery<MenuItemRow[], Error>({
    queryKey: ["food-menu"],
    queryFn: fetchMenuItems,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: MenuItemInsert) => {
      if (editingId !== null) {
        return updateMenuItem(editingId, payload);
      }
      return createMenuItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-menu"] });
      resetForm();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-menu"] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setAllergenInput("");
    setImagePreview("");
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file, "oda web pictures", "menu");
      setForm((prev) => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } catch (err: any) {
      alert("Upload failed: " + (err?.message ?? "Unknown upload error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) await handleImageUpload(file);
  };

  const addAllergen = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const clean = allergenInput.trim();
    if (!clean) return;
    setForm((prev) => ({
      ...prev,
      allergens: [...(prev.allergens ?? []), clean],
    }));
    setAllergenInput("");
  };

  const removeAllergen = (index: number) => {
    setForm((prev) => ({
      ...prev,
      allergens: (prev.allergens ?? []).filter((_, i) => i !== index),
    }));
  };

  const startEdit = (item: MenuItemRow) => {
    setShowForm(true);
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      description: item.description,
      price: item.price,
      allergens: item.allergens ?? [],
      featured: !!item.featured,
      image_url: item.image_url ?? "",
    });
    setImagePreview(item.image_url ?? "");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.description.trim() ||
      !form.price.trim()
    ) {
      alert("Please fill in the required menu fields.");
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Dining</p>
            <h1 className="font-serif text-3xl text-forest-deep tracking-tight">Chef's menu</h1>
          </div>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-deep px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-soft hover:bg-gold hover:shadow-luxury transition-all duration-300"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-[2rem] border border-border/80 bg-background/50 p-8 shadow-luxury backdrop-blur-md"
        >
          <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="font-serif text-2xl text-forest-deep">
              {editingId !== null ? "Edit menu item" : "Create menu item"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Category</span>
                  <input
                    required
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="Starters"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Price</span>
                  <input
                    required
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="Br 1,500"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-forest-deep">Item name</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="Berbere Chicken Skewers"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-forest-deep">Description</span>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="Slow-roasted chicken, teff flatbread, citrus herb relish..."
                />
              </label>

              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">
                    Allergens / ingredients
                  </span>
                  <input
                    value={allergenInput}
                    onChange={(e) => setAllergenInput(e.target.value)}
                    onKeyDown={addAllergen}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="Type an allergen and press Enter"
                  />
                </label>

                {form.allergens && form.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.allergens.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] font-medium text-forest-deep"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeAllergen(index)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${item}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-medium text-forest-deep">Menu image</label>
              <div
                className={`relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed ${imagePreview ? "border-border/0" : "border-border hover:border-gold/60"} bg-muted/10 transition-all duration-300`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Menu preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-center text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                      Replace image
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gold/10 text-gold">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">Drop a menu image here</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload(file);
                }}
              />

              <label className="inline-flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-forest-deep">
                <input
                  type="checkbox"
                  checked={!!form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 accent-gold"
                />
                Mark as chef's special
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saveMutation.isPending || isUploading}
                  className="flex-1 rounded-xl bg-forest-deep px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
                >
                  {saveMutation.isPending
                    ? "Saving…"
                    : editingId !== null
                      ? "Update item"
                      : "Save item"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-background/50 p-8 text-sm text-muted-foreground">
            Loading menu…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 p-10 text-center text-muted-foreground">
            No menu items yet. Add your first signature dish.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-5 rounded-[1.75rem] border border-border bg-background/60 p-5 shadow-soft md:flex-row md:items-center"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-24 w-full rounded-2xl object-cover md:h-28 md:w-28"
                />
              ) : (
                <div className="grid h-24 w-full place-items-center rounded-2xl bg-cream text-gold md:h-28 md:w-28">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-forest-deep">
                    {item.category}
                  </span>
                  {item.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gold-foreground">
                      <Check className="h-3 w-3" /> Chef's special
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-serif text-2xl text-forest-deep">{item.title}</h3>
                  <span className="text-base font-semibold text-gold-foreground">{item.price}</span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
                  {item.description}
                </p>
                {item.allergens && item.allergens.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.allergens.map((allergen) => (
                      <span
                        key={`${item.id}-${allergen}`}
                        className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-2 md:flex-col">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-forest-deep hover:border-gold/60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-destructive hover:bg-destructive/15"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
