import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { deleteBookingsByEmails, fetchGuests } from "@/lib/supabase-service";
import type { GuestRow } from "@/lib/supabase-types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/guests")({
  component: GuestsPage,
});

const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-900 border-amber-300",
  Silver: "bg-slate-100 text-slate-800 border-slate-300",
  Gold: "bg-gold/20 text-gold-foreground border-gold",
  Platinum: "bg-forest-deep text-white border-forest-deep",
};
const PAGE_SIZE = 9;

function GuestsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [selectedGuestEmails, setSelectedGuestEmails] = useState<string[]>([]);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const { data: guestData, isLoading } = useQuery<GuestRow[], Error>({
    queryKey: ["guests"],
    queryFn: fetchGuests,
    placeholderData: [],
    retry: false,
  });

  const guestList = useMemo(() => guestData ?? [], [guestData]);

  const filtered = useMemo(
    () =>
      guestList.filter(
        (g) =>
          g.name.toLowerCase().includes(q.toLowerCase()) ||
          g.email.toLowerCase().includes(q.toLowerCase()),
      ),
    [guestList, q],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleGuests = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const deleteSelectedGuestsMutation = useMutation({
    mutationFn: deleteBookingsByEmails,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["guests"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Guest deletion failed. Please try again.");
    },
  });

  const deleteSelectedGuests = async () => {
    const emails = filtered
      .filter((guest) => selectedGuestEmails.includes(guest.email))
      .map((guest) => guest.email);
    if (!emails.length) {
      toast.warning("Select at least one guest profile before deleting.");
      return;
    }

    const guestNames = filtered
      .filter((guest) => emails.includes(guest.email))
      .map((guest) => guest.name)
      .slice(0, 3)
      .join(", ");
    const extra = emails.length > 3 ? ` and ${emails.length - 3} more guest(s)` : "";
    setConfirmDialog({
      open: true,
      title: `Delete ${emails.length} Guest Profile${emails.length > 1 ? "s" : ""}`,
      description: `This will permanently remove ${guestNames || "the selected guest"}${extra} from the bookings history. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        try {
          setBulkDeletePending(true);
          await deleteSelectedGuestsMutation.mutateAsync(emails);
          setSelectedGuestEmails([]);
          toast.success(`Deleted ${emails.length} guest profile${emails.length > 1 ? "s" : ""} successfully.`);
        } catch (error: any) {
          console.error("Guest bulk delete failed:", error);
          toast.error(error?.message || "Unable to delete the selected guest profiles. Please try again.");
        } finally {
          setBulkDeletePending(false);
        }
      },
    });
  };

  const selectedVisibleGuestEmails = useMemo(
    () => visibleGuests.map((guest) => guest.email),
    [visibleGuests],
  );
  const allVisibleGuestsSelected =
    visibleGuests.length > 0 &&
    selectedVisibleGuestEmails.every((email) => selectedGuestEmails.includes(email));

  const toggleGuestSelection = (email: string) => {
    setSelectedGuestEmails((current) =>
      current.includes(email) ? current.filter((item) => item !== email) : [...current, email],
    );
  };

  const toggleSelectAllGuests = () => {
    setSelectedGuestEmails((current) => {
      if (visibleGuests.length === 0) return current;
      const nextEmails = new Set(current);
      if (allVisibleGuestsSelected) {
        for (const email of selectedVisibleGuestEmails) nextEmails.delete(email);
      } else {
        for (const email of selectedVisibleGuestEmails) nextEmails.add(email);
      }
      return Array.from(nextEmails);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Loyalty</p>
        <h1 className="mt-2 font-serif text-4xl text-forest-deep">Guests</h1>
        <p className="mt-2 text-muted-foreground">{guestList.length} guest profiles</p>
      </div>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Search guests…"
        className="w-full max-w-md bg-background border border-border px-4 py-2.5 text-sm focus:border-gold outline-none"
      />

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
        <label className="inline-flex items-center gap-3 text-muted-foreground">
          <input
            type="checkbox"
            checked={visibleGuests.length > 0 && allVisibleGuestsSelected}
            onChange={toggleSelectAllGuests}
            className="h-4 w-4 accent-forest-deep"
            aria-label="Select all visible guests"
          />
          <span>Select all visible</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {selectedGuestEmails.length} selected
          </span>
          <button
            type="button"
            onClick={deleteSelectedGuests}
            disabled={bulkDeletePending || selectedGuestEmails.length === 0}
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
          >
            {bulkDeletePending ? "Deleting..." : "Delete selected"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Loading guest profiles...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleGuests.map((g) => (
              <div
                key={g.id}
                className="bg-background border border-border p-6 hover:shadow-luxury transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedGuestEmails.includes(g.email)}
                      onChange={() => toggleGuestSelection(g.email)}
                      className="h-4 w-4 accent-forest-deep"
                      aria-label={`Select guest ${g.name}`}
                    />
                    <div className="grid place-items-center h-12 w-12 rounded-full bg-forest-deep text-white font-serif text-lg">
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-forest-deep">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.country}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${TIER_COLORS[g.tier]}`}
                  >
                    {g.tier}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {g.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {g.phone}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-serif text-xl text-forest-deep">{g.visits}</div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      Visits
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-xl text-forest-deep">
                      ${(g.totalSpend / 1000).toFixed(1)}k
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      Lifetime
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-xl text-forest-deep">{g.lastStay.slice(5)}</div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      Last stay
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {visibleGuests.length === 0 && (
              <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed border-border bg-background">
                No guest profiles match your search.
              </div>
            )}
          </div>

          {filtered.length > PAGE_SIZE && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === safePage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={toggleSelectAllGuests}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all bg-gold text-gold-foreground hover:bg-gold/90 focus:outline-none"
            >
              {allVisibleGuestsSelected ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={deleteSelectedGuests}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all bg-red-500 text-white hover:bg-red-600 focus:outline-none"
              disabled={bulkDeletePending}
            >
              {bulkDeletePending ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
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
      />
    </div>
  );
}
