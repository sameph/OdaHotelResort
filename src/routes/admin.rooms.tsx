import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UploadCloud, Box, BedDouble, Maximize, Users } from "lucide-react";
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
  uploadImage,
} from "@/lib/supabase-service";
import type { RoomInsert, RoomRow } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/rooms")({
  component: RoomsAdminPage,
});

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500",
  occupied: "bg-forest-deep",
  cleaning: "bg-gold",
  maintenance: "bg-red-500",
};

const ROOM_FILTERS = ["all", "available", "occupied", "cleaning", "maintenance"] as const;
type RoomFilter = (typeof ROOM_FILTERS)[number];

function formatBirr(n: number) {
  return "Br " + n.toLocaleString("en-US");
}

function RoomsAdminPage() {
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomInsert>({
    number: "",
    name: "",
    slug: "",
    type: "Deluxe",
    view: "Garden View",
    capacity: 2,
    price: 0,
    status: "available",
    floor: 1,
    description: "",
    amenities: [],
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const queryClient = useQueryClient();
  const { data: roomData, isLoading } = useQuery<RoomRow[], Error>({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    placeholderData: [],
    retry: false,
  });
  const roomList = roomData ?? [];
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["rooms"] });

  const clearForm = () => {
    setForm({
      number: "",
      name: "",
      slug: "",
      type: "Deluxe",
      view: "Garden View",
      capacity: 2,
      price: 0,
      status: "available",
      floor: 1,
      description: "",
      amenities: [],
      image_url: "",
    });
    setEditingRoomId(null);
    setImageFile(null);
    setImagePreview("");
    setFormError(null);
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => uploadImage(file, "room-images", "room-images"),
  });

  const saveRoom = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      clearForm();
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, room }: { id: number; room: RoomInsert }) => updateRoom(id, room),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      clearForm();
    },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RoomRow["status"] }) =>
      updateRoom(id, { status }),
    onSuccess: invalidate,
  });
  const removeRoom = useMutation({ mutationFn: deleteRoom, onSuccess: invalidate });
  const filtered = useMemo(
    () => (filter === "all" ? roomList : roomList.filter((r) => r.status === filter)),
    [filter, roomList],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: roomList.length };
    for (const r of roomList) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [roomList]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Inventory</p>
          <h1 className="mt-2 font-serif text-4xl text-forest-deep">Rooms</h1>
          <p className="mt-2 text-muted-foreground">Live status across {roomList.length} keys</p>
        </div>
        <button
          onClick={() => {
            clearForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-forest-deep text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition shadow-sm rounded-md"
        >
          <Plus className="h-4 w-4" /> Add room
        </button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-4">
        {ROOM_FILTERS.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-left p-4 rounded-xl border transition-all duration-300 ${
              filter === k
                ? "bg-forest-deep text-white border-forest-deep shadow-md"
                : "bg-background border-border hover:border-gold hover:bg-gold/5"
            }`}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">{k}</div>
            <div className="mt-1 font-serif text-2xl">{counts[k] ?? 0}</div>
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={async (event: FormEvent) => {
            event.preventDefault();
            setFormError(null);
            let finalImageUrl = form.image_url;

            if (imageFile) {
              try {
                finalImageUrl = await uploadImageMutation.mutateAsync(imageFile);
              } catch (err: any) {
                console.error("Image upload failed:", err);
                const msg = err?.message || "Unknown error";
                setFormError("Image upload failed: " + msg);
                toast.error("Image upload failed: " + msg);
                return;
              }
            }

            const roomPayload = {
              ...form,
              image_url: finalImageUrl,
              slug:
                form.slug ||
                (form.name ?? "")
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-"),
            };

            if (editingRoomId) {
              updateRoomMutation.mutate({ id: editingRoomId, room: roomPayload });
            } else {
              saveRoom.mutate(roomPayload);
            }
          }}
          className="grid gap-4 bg-background border border-border p-6 md:grid-cols-2"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gold">
                  {editingRoomId ? "Edit room" : "New room"}
                </p>
                <h2 className="mt-2 text-2xl font-serif text-forest-deep">
                  {editingRoomId ? "Update room details" : "Add room"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  clearForm();
                }}
                className="rounded border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50"
              >
                Close
              </button>
            </div>

            <label className="space-y-2 text-sm text-forest-deep">
              Room number
              <input
                required
                placeholder="101"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Display name
              <input
                required
                placeholder="Deluxe Ocean View"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Room type
              <input
                required
                placeholder="Deluxe"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              View
              <input
                required
                placeholder="Garden View"
                value={form.view}
                onChange={(e) => setForm({ ...form, view: e.target.value })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="space-y-2 text-sm text-forest-deep">
              Capacity
              <input
                required
                type="number"
                min="1"
                placeholder="2"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Price / night
              <input
                required
                type="number"
                min="0"
                placeholder="120"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Floor
              <input
                required
                type="number"
                min="1"
                placeholder="1"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RoomRow["status"] })}
                className="w-full border border-border p-3 text-sm"
              >
                {ROOM_FILTERS.slice(1).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-forest-deep">
              Room description
              <textarea
                rows={4}
                placeholder="A bright room with large windows, ensuite bathroom and panoramic views."
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-border p-3 text-sm"
              />
            </label>

            <div>
              <label className="block text-sm text-forest-deep mb-2">Room image</label>
              <div 
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 px-4 transition-colors ${
                  isDragActive ? "border-gold bg-gold/5" : "border-border/60 hover:border-forest-deep bg-muted/10 cursor-pointer"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                />
                <div className="text-center flex items-center justify-center gap-4 pointer-events-none">
                  <div className="rounded-full bg-background p-2.5 shadow-sm text-forest-deep/70 transition-colors">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-forest-deep">Upload image</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Drag & drop or click</p>
                  </div>
                </div>
              </div>
            </div>

            {(imagePreview || form.image_url) && (
              <div className="overflow-hidden rounded-md border border-border">
                <img
                  src={imagePreview || form.image_url || ""}
                  alt="Room preview"
                  className="h-40 w-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  saveRoom.isPending ||
                  updateRoomMutation.isPending ||
                  uploadImageMutation.isPending
                }
                className="inline-flex items-center justify-center rounded bg-forest-deep px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold disabled:opacity-50"
              >
                {editingRoomId ? "Update room" : "Save room"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  clearForm();
                }}
                className="inline-flex items-center justify-center rounded border border-border bg-background px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>

            {(formError ||
              saveRoom.error ||
              updateRoomMutation.error ||
              uploadImageMutation.error) && (
              <p className="text-sm text-destructive">
                {formError ||
                  saveRoom.error?.message ||
                  updateRoomMutation.error?.message ||
                  "Image upload failed. Please try again."}
              </p>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border bg-background p-4 shadow-sm animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded-2xl w-full" />
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded-full w-1/3" />
                <div className="h-5 bg-muted rounded-full w-3/4" />
                <div className="h-3 bg-muted rounded-full w-full mt-2" />
                <div className="h-3 bg-muted rounded-full w-4/5" />
              </div>
              <div className="h-10 bg-muted rounded-lg w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-border bg-background max-w-2xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-muted/60 rounded-full grid place-items-center mb-4 text-muted-foreground">
            <Box className="h-8 w-8 opacity-50" />
          </div>
          <h3 className="font-serif text-2xl text-forest-deep">No rooms found</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">There are no rooms matching your current filter. Try adding a new room or clearing the active filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="group bg-background border border-border overflow-hidden hover:shadow-luxury transition-all duration-500 flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.name ?? r.number}
                    className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    No image
                  </div>
                )}
                
                <span className={`absolute top-4 left-4 text-[10px] px-3 py-1 uppercase tracking-[0.2em] font-semibold text-white shadow-sm backdrop-blur-md ${STATUS_COLORS[r.status]}`}>
                  {r.status}
                </span>

                <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-2 text-sm">
                  <span className="font-semibold text-forest-deep">{formatBirr(r.price)}</span>
                  <span className="text-xs text-muted-foreground">/night</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{r.type} · Floor {r.floor}</p>
                </div>
                <h3 className="mt-2 font-serif text-2xl text-forest-deep">{r.name ?? `Room ${r.number}`}</h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed flex-1">
                  {r.description || "No description available."}
                </p>

                {r.amenities && r.amenities.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {r.amenities.slice(0, 4).map((t) => (
                      <span key={t} className="text-[11px] bg-cream px-2.5 py-1 text-forest">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-5 flex items-center justify-between gap-3 border-t border-border">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gold" />{r.beds?.split(" ").slice(0, 2).join(" ") ?? "1 Bed"}</span>
                    <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-gold" />{r.size_sqm ? `${r.size_sqm} sqm` : "32 sqm"}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gold" />{r.capacity}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Edit Room"
                      onClick={() => {
                        setShowForm(true);
                        setEditingRoomId(r.id);
                        setForm({
                          number: r.number,
                          name: r.name ?? "",
                          slug: r.slug ?? "",
                          type: r.type,
                          view: r.view,
                          capacity: r.capacity,
                          price: r.price,
                          status: r.status,
                          floor: r.floor,
                          description: r.description ?? "",
                          amenities: r.amenities ?? [],
                          image_url: r.image_url ?? "",
                          beds: r.beds ?? null,
                          size_sqm: r.size_sqm ?? null,
                          popular: r.popular ?? null,
                        } as RoomInsert);
                        setImagePreview(r.image_url ?? "");
                      }}
                      className="rounded-lg border border-border bg-muted/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-forest-deep hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      title="Delete Room"
                      onClick={() => {
                        if (window.confirm(`Delete room ${r.number}? This cannot be undone.`)) {
                          removeRoom.mutate(r.id);
                        }
                      }}
                      className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="w-1/2">
                    <select
                      aria-label={`Change status for ${r.number}`}
                      value={r.status}
                      onChange={(e) =>
                        changeStatus.mutate({ id: r.id, status: e.target.value as RoomRow["status"] })
                      }
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-[10px] uppercase tracking-[0.1em] focus:border-gold outline-none transition-colors"
                    >
                      <option value="" disabled>Status</option>
                      {ROOM_FILTERS.slice(1).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
