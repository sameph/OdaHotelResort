import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UploadCloud, Box, BedDouble, Maximize, Users } from "lucide-react";
import {
  createRoom,
  deleteRoom,
  deleteRooms,
  fetchRooms,
  updateRoom,
  uploadImage,
} from "@/lib/supabase-service";
import type { RoomInsert, RoomRow } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/rooms")({
  component: RoomsAdminPage,
});

export const ROOM_CATEGORIES = ["Standard", "Twin", "Suite", "Family", "King"] as const;
export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500",
  occupied: "bg-destructive",
  cleaning: "bg-gold",
  maintenance: "bg-amber-600",
};

const ROOM_FILTERS = ["all", "available", "occupied", "cleaning", "maintenance"] as const;
type RoomFilter = (typeof ROOM_FILTERS)[number];

function formatBirr(n: number) {
  return "Br " + n.toLocaleString("en-US");
}

function RoomsAdminPage() {
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomInsert>({
    number: "",
    name: "",
    slug: "",
    type: "Standard",
    view: "Garden View",
    capacity: 2,
    price: 0,
    status: "available",
    floor: 1,
    description: "",
    amenities: [],
    image_url: "",
    quantity: 1,
    available_quantity: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
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
      type: "Standard",
      view: "Garden View",
      capacity: 2,
      price: 0,
      status: "available",
      floor: 1,
      description: "",
      amenities: [],
      image_url: "",
      quantity: 1,
      available_quantity: 1,
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
    mutationFn: ({
      id,
      status,
      available_quantity,
    }: {
      id: number;
      status: RoomRow["status"];
      available_quantity?: number;
    }) =>
      updateRoom(id, {
        status,
        ...(available_quantity !== undefined ? { available_quantity } : {}),
      }),
    onSuccess: invalidate,
  });
  const removeRoom = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      invalidate();
      toast.success("Room deleted successfully.");
    },
    onError: (error: any) => {
      console.error("Room delete failed:", error);
      toast.error(error?.message || "Unable to delete the room. Please try again.");
    },
  });
  const deleteRoomsMutation = useMutation({
    mutationFn: deleteRooms,
    onSuccess: invalidate,
    onError: (error: any) => {
      toast.error(error?.message || "Room deletion failed. Please try again.");
    },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: roomList.length };
    for (const r of roomList) {
      const avail =
        r.available_quantity !== undefined && r.available_quantity !== null
          ? r.available_quantity
          : r.status === "occupied"
            ? 0
            : (r.quantity ?? 1);
      const effectiveStatus = r.status === "occupied" || avail <= 0 ? "occupied" : r.status;
      c[effectiveStatus] = (c[effectiveStatus] ?? 0) + 1;
    }
    return c;
  }, [roomList]);

  const filtered = useMemo(() => {
    return roomList.filter((r) => {
      const avail =
        r.available_quantity !== undefined && r.available_quantity !== null
          ? r.available_quantity
          : r.status === "occupied"
            ? 0
            : (r.quantity ?? 1);
      const isOccupied = r.status === "occupied" || avail <= 0;

      if (filter === "available" && isOccupied) return false;
      if (filter === "occupied" && !isOccupied) return false;
      if (
        filter !== "all" &&
        filter !== "available" &&
        filter !== "occupied" &&
        r.status !== filter
      )
        return false;

      if (categoryFilter !== "all" && r.type?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [filter, categoryFilter, roomList]);

  const selectedVisibleRoomIds = useMemo(() => filtered.map((room) => room.id), [filtered]);
  const allVisibleRoomsSelected =
    filtered.length > 0 && selectedVisibleRoomIds.every((id) => selectedRoomIds.includes(id));

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRoomIds((current) =>
      current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId],
    );
  };

  const toggleSelectAllRooms = () => {
    setSelectedRoomIds((current) => {
      if (filtered.length === 0) return current;
      const nextIds = new Set(current);
      if (allVisibleRoomsSelected) {
        for (const roomId of selectedVisibleRoomIds) nextIds.delete(roomId);
      } else {
        for (const roomId of selectedVisibleRoomIds) nextIds.add(roomId);
      }
      return Array.from(nextIds);
    });
  };

  const deleteSelectedRooms = async () => {
    const ids = filtered.filter((room) => selectedRoomIds.includes(room.id)).map((room) => room.id);
    if (!ids.length) {
      toast.warning("Select at least one room before deleting.");
      return;
    }

    const roomNames = filtered
      .filter((room) => ids.includes(room.id))
      .map((room) => room.number)
      .slice(0, 3)
      .join(", ");
    const extra = ids.length > 3 ? ` and ${ids.length - 3} more room(s)` : "";
    setConfirmDialog({
      open: true,
      title: `Delete ${ids.length} Room${ids.length > 1 ? "s" : ""}`,
      description: `This will permanently remove ${roomNames || "the selected room"}${extra} from inventory. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        try {
          setBulkDeletePending(true);
          await deleteRoomsMutation.mutateAsync(ids);
          setSelectedRoomIds([]);
          toast.success(`Deleted ${ids.length} room${ids.length > 1 ? "s" : ""} successfully.`);
        } catch (error: any) {
          console.error("Room bulk delete failed:", error);
          toast.error(error?.message || "Unable to delete the selected rooms. Please try again.");
        } finally {
          setBulkDeletePending(false);
        }
      },
    });
  };

  const { number, name, slug, type, view, capacity, price, status, floor, description, amenities } =
    form;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Inventory</p>
          <h1 className="mt-2 font-serif text-4xl text-forest-deep">Rooms</h1>
          <p className="mt-2 text-muted-foreground">Live status across {roomList.length} keys</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedRoomIds.length > 0 && (
            <button
              type="button"
              onClick={deleteSelectedRooms}
              disabled={bulkDeletePending}
              className="inline-flex items-center justify-center rounded border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-60"
            >
              {bulkDeletePending ? "Deleting..." : `Delete selected (${selectedRoomIds.length})`}
            </button>
          )}
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
      </div>

      {/* Category and Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground mr-1">Category:</span>
          {["all", ...ROOM_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? "bg-forest-deep text-white font-medium shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat === "all" ? "All Categories" : `${cat} Room`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground mr-1">Status:</span>
          {ROOM_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${
                filter === s
                  ? "bg-gold text-gold-foreground font-semibold shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {s} {counts[s] !== undefined ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
        <label className="inline-flex items-center gap-3 text-muted-foreground">
          <input
            type="checkbox"
            checked={filtered.length > 0 && allVisibleRoomsSelected}
            onChange={toggleSelectAllRooms}
            className="h-4 w-4 accent-forest-deep"
            aria-label="Select all visible rooms"
          />
          <span>Select all visible</span>
        </label>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {selectedRoomIds.length} selected
        </span>
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

            const totalQty =
              Number(form.quantity) >= 1 ? Number(form.quantity) : 1;
            const availQty =
              form.available_quantity !== undefined && form.available_quantity !== null
                ? Math.min(totalQty, Math.max(0, Number(form.available_quantity)))
                : totalQty;
            const status =
              availQty <= 0
                ? "occupied"
                : form.status === "occupied"
                  ? "available"
                  : form.status;

            const roomPayload = {
              ...form,
              image_url: finalImageUrl,
              slug:
                form.slug ||
                (form.name ?? "")
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-"),
              quantity: totalQty,
              available_quantity: availQty,
              status,
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
              Room number / identifier
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
              Room Category (5 Categories)
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-border p-3 text-sm bg-background font-medium"
              >
                {ROOM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} Room
                  </option>
                ))}
                {!ROOM_CATEGORIES.includes(form.type as any) && form.type && (
                  <option value={form.type}>{form.type} (Legacy)</option>
                )}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2 text-sm text-forest-deep">
                Total Quantity
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="10"
                  value={form.quantity ?? 1}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value) || 1);
                    setForm((prev) => ({
                      ...prev,
                      quantity: q,
                      available_quantity: !editingRoomId ? q : Math.min(prev.available_quantity ?? q, q),
                    }));
                  }}
                  className="w-full border border-border p-3 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm text-forest-deep">
                Available Rooms
                <input
                  required
                  type="number"
                  min="0"
                  max={form.quantity ?? 9999}
                  placeholder="10"
                  value={form.available_quantity ?? 1}
                  onChange={(e) => {
                    const avail = Math.max(0, Number(e.target.value) || 0);
                    setForm((prev) => ({
                      ...prev,
                      available_quantity: avail,
                      status:
                        avail === 0
                          ? "occupied"
                          : prev.status === "occupied"
                            ? "available"
                            : prev.status,
                    }));
                  }}
                  className="w-full border border-border p-3 text-sm font-semibold"
                />
              </label>
            </div>
            {(form.available_quantity ?? 1) === 0 ? (
              <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded border border-destructive/20">
                Notice: With 0 available rooms, this category will explicitly show as ALL OCCUPIED.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Guests will be able to book from the {form.available_quantity ?? 1} currently available room(s).
              </p>
            )}

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
                  isDragActive
                    ? "border-gold bg-gold/5"
                    : "border-border/60 hover:border-forest-deep bg-muted/10 cursor-pointer"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
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
            <div
              key={i}
              className="rounded-3xl border border-border bg-background p-4 shadow-sm animate-pulse space-y-4"
            >
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
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            There are no rooms matching your current filter. Try adding a new room or clearing the
            active filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const totalQty = r.quantity ?? 1;
            const availQty =
              r.available_quantity !== undefined && r.available_quantity !== null
                ? r.available_quantity
                : r.status === "occupied"
                  ? 0
                  : totalQty;
            const isOccupied = r.status === "occupied" || availQty <= 0;

            return (
              <article
                key={r.id}
                className={`group bg-background border overflow-hidden hover:shadow-luxury transition-all duration-500 flex flex-col ${
                  isOccupied ? "border-destructive/40 bg-destructive/[0.015]" : "border-border"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                  <label className="absolute left-4 top-4 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/60 bg-background/80 shadow-sm">
                    <input
                      type="checkbox"
                      checked={selectedRoomIds.includes(r.id)}
                      onChange={() => toggleRoomSelection(r.id)}
                      className="h-4 w-4 accent-forest-deep"
                      aria-label={`Select room ${r.number}`}
                    />
                  </label>
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

                  {/* Explicit Availability & Status Badge */}
                  {isOccupied ? (
                    <span className="absolute top-4 left-4 text-[10px] px-3 py-1 uppercase tracking-[0.2em] font-bold text-white shadow-md backdrop-blur-md bg-destructive">
                      ALL OCCUPIED (0/{totalQty})
                    </span>
                  ) : (
                    <span className="absolute top-4 left-4 text-[10px] px-3 py-1 uppercase tracking-[0.2em] font-semibold text-white shadow-sm backdrop-blur-md bg-emerald-600">
                      {availQty} of {totalQty} AVAILABLE
                    </span>
                  )}

                  <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-2 text-sm">
                    <span className="font-semibold text-forest-deep">{formatBirr(r.price)}</span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">
                      {r.type} Room · Floor {r.floor}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                        isOccupied
                          ? "bg-destructive/15 text-destructive border border-destructive/20"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isOccupied ? "Occupied" : `${availQty}/${totalQty} Left`}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl text-forest-deep">
                    {r.name ?? `Room ${r.number}`}
                  </h3>
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
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-gold" />
                        {r.beds?.split(" ").slice(0, 2).join(" ") ?? "1 Bed"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5 text-gold" />
                        {r.size_sqm ? `${r.size_sqm} sqm` : "32 sqm"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gold" />
                        {r.capacity}
                      </span>
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
                            quantity: totalQty,
                            available_quantity: availQty,
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
                          setConfirmDialog({
                            open: true,
                            title: `Delete Room ${r.number}`,
                            description: `This will permanently remove "${r.name || "Unnamed room"}" from inventory. This action cannot be undone.`,
                            onConfirm: () => {
                              removeRoom.mutate(r.id);
                              setConfirmDialog((d) => ({ ...d, open: false }));
                            },
                          });
                        }}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="w-1/2">
                      <select
                        aria-label={`Change status for ${r.number}`}
                        value={isOccupied ? "occupied" : r.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as RoomRow["status"];
                          const nextAvail =
                            newStatus === "occupied"
                              ? 0
                              : r.available_quantity && r.available_quantity > 0
                                ? r.available_quantity
                                : totalQty;
                          changeStatus.mutate({
                            id: r.id,
                            status: newStatus,
                            available_quantity: nextAvail,
                          });
                        }}
                        className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-[10px] uppercase tracking-[0.1em] focus:border-gold outline-none transition-colors font-medium"
                      >
                        <option value="" disabled>
                          Status
                        </option>
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
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}
