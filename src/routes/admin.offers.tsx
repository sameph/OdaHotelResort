import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UploadCloud, X, Box } from "lucide-react";
import { useAdminRole } from "./admin";
import {
  fetchOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  uploadImage,
} from "@/lib/supabase-service";
import type { OfferRow, OfferInsert } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/offers")({
  component: OffersAdminPage,
});

function OffersAdminPage() {
  const role = useAdminRole();
  if (role === "receptionist") {
    return <div className="p-16 text-center text-muted-foreground">Unauthorized access. Only administrators can manage Offers.</div>;
  }

  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);

  const [form, setForm] = useState<OfferInsert>({
    tag: "",
    title: "",
    price: "",
    from_label: "from",
    perks: [],
    image_url: "",
  });

  const [perkInput, setPerkInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: offers = [], isLoading } = useQuery<OfferRow[], Error>({
    queryKey: ["offers"],
    queryFn: fetchOffers,
  });

  const saveOffer = useMutation({
    mutationFn: async (data: OfferInsert) => {
      if (editingOfferId) {
        return updateOffer(editingOfferId, data);
      } else {
        return createOffer(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      setShowForm(false);
      resetForm();
    },
  });

  const removeOffer = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });

  const resetForm = () => {
    setEditingOfferId(null);
    setForm({
      tag: "",
      title: "",
      price: "",
      from_label: "from",
      perks: [],
      image_url: "",
    });
    setPerkInput("");
    setImagePreview("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleImageUpload(files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file, "oda web pictures", "offers");
      setForm((prev) => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const addPerk = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (perkInput.trim()) {
        setForm((p) => ({ ...p, perks: [...p.perks, perkInput.trim()] }));
        setPerkInput("");
      }
    }
  };

  const removePerk = (index: number) => {
    setForm((p) => ({ ...p, perks: p.perks.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.perks.length === 0) {
      alert("Please add at least one perk/feature.");
      return;
    }
    saveOffer.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-forest-deep tracking-tight">Active Offers</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-deep px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-soft hover:bg-gold hover:shadow-luxury transition-all duration-300"
          >
            <Plus className="h-4 w-4" /> Add Offer
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 bg-background/50 border border-border/80 backdrop-blur-md rounded-[2rem] p-8 shadow-luxury animate-fade-down relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/40 via-forest/40 to-gold/40" />
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <h2 className="font-serif text-2xl text-forest-deep">
              {editingOfferId ? "Edit Offer" : "Design New Offer"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted/50"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="grid gap-6 grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Tagline / Category</span>
                  <input
                    required
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="e.g. Honeymoon"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Display Title</span>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="Ethiopian Honeymoon"
                  />
                </label>
              </div>

              <div className="grid gap-6 grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Pricing (Text)</span>
                  <input
                    required
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="Br 42,000"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Price Prefix</span>
                  <input
                    required
                    type="text"
                    value={form.from_label}
                    onChange={(e) => setForm({ ...form, from_label: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="from"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-forest-deep">Package Perks (Press Enter)</span>
                  <input
                    type="text"
                    value={perkInput}
                    onChange={(e) => setPerkInput(e.target.value)}
                    onKeyDown={addPerk}
                    className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="e.g. 2 nights in a Deluxe King"
                  />
                </label>
                {form.perks.length > 0 && (
                  <ul className="grid grid-cols-2 gap-3 mt-4">
                    {form.perks.map((perk, i) => (
                      <li key={i} className="flex items-center justify-between bg-muted/30 border border-border/50 px-3 py-2 rounded-lg text-xs font-medium text-forest-deep gap-2 group">
                        <span className="truncate">{perk}</span>
                        <button type="button" onClick={() => removePerk(i)} className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <label className="block text-sm font-medium text-forest-deep mb-2">Offer Image</label>
              <div 
                className={`relative flex-1 group overflow-hidden rounded-2xl border-2 border-dashed ${imagePreview ? 'border-border/0' : 'border-border hover:border-gold/50'} bg-muted/10 transition-all duration-300 flex items-center justify-center`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">Replace offer image</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-muted/30 transition-colors h-48">
                    <div className="h-12 w-12 rounded-full bg-gold/10 text-gold grid place-items-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-forest-deep mb-1">Upload a high quality image</p>
                    <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent shadow-sm" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-forest-deep">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border/50">
            <button
              type="submit"
              disabled={saveOffer.isPending || isUploading}
              className="bg-forest-deep text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-soft hover:shadow-luxury hover:bg-gold transition-all duration-300 disabled:opacity-50"
            >
              {saveOffer.isPending ? "Saving..." : "Save Offer"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[400px] rounded-3xl bg-muted/40 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-3xl border border-border bg-background/50 max-w-2xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-gold/10 rounded-full grid place-items-center mb-5 text-gold">
            <Box className="h-8 w-8 opacity-80" />
          </div>
          <h3 className="font-serif text-3xl text-forest-deep tracking-tight mb-2">No active offers</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            There are currently no promotional packages available. Design and publish a new offer to attract guests.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-8 inline-flex items-center gap-2 border-b-2 border-gold pb-1 text-sm font-semibold uppercase tracking-wider text-forest-deep hover:text-gold transition-colors"
          >
            Create your first offer
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <article key={o.id} className="group bg-background border border-border overflow-hidden hover:shadow-luxury transition-all duration-500 flex flex-col rounded-2xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                {o.image_url ? (
                  <img src={o.image_url} alt={o.title} className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    No image
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-gold text-white text-[10px] px-3 py-1 uppercase tracking-[0.25em] font-medium shadow-sm">
                  {o.tag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-serif text-2xl text-forest-deep">{o.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80 flex-1">
                  {o.perks.slice(0, 4).map((p, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="text-gold mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                  {o.perks.length > 4 && (
                    <li className="text-xs text-muted-foreground italic mt-2">
                       + {o.perks.length - 4} more perks
                    </li>
                  )}
                </ul>
                <div className="mt-6 flex items-center justify-between border-b border-border pb-5">
                   <div>
                     <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{o.from_label}</div>
                     <div className="font-serif text-2xl text-forest-deep">{o.price}</div>
                   </div>
                </div>
                <div className="mt-4 pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                      setEditingOfferId(o.id);
                      setForm({
                        tag: o.tag,
                        title: o.title,
                        price: o.price,
                        from_label: o.from_label,
                        perks: o.perks,
                        image_url: o.image_url || "",
                      } as OfferInsert);
                      setImagePreview(o.image_url || "");
                      setPerkInput("");
                    }}
                    className="flex-1 rounded-xl border border-border bg-muted/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-forest-deep hover:text-white transition-colors"
                  >
                    Edit Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete offer "${o.title}"?`)) removeOffer.mutate(o.id);
                    }}
                    className="flex-1 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
