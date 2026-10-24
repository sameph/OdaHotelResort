import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Plus, FileText, Check, ExternalLink, X, Landmark, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchBookings, updateBookingStatus } from "@/lib/supabase-service";
import type { BookingRow } from "@/lib/supabase-types";

type BookingStatus = "confirmed" | "checked-in" | "checked-out" | "pending" | "cancelled";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsPage,
});

const STATUSES: (BookingStatus | "all")[] = [
  "all",
  "confirmed",
  "checked-in",
  "checked-out",
  "pending",
  "cancelled",
];
const PAGE_SIZE = 10;

function BookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [roomType, setRoomType] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [viewingReceiptBooking, setViewingReceiptBooking] = useState<BookingRow | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BookingRow[], Error>({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    placeholderData: [],
    retry: false,
  });

  const bookings = useMemo(() => data ?? [], [data]);

  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) =>
      updateBookingStatus(id, nextStatus),
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      if (vars.nextStatus === "confirmed") {
        toast.success(
          `Booking ${data.ref || `#${data.id}`} confirmed! 1 room deducted from inventory.`,
        );
      } else {
        toast.success(`Booking status updated to ${vars.nextStatus}.`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update booking status.");
    },
  });

  function getReceiptUrl(b: BookingRow): string | null {
    if (b.receipt_url) return b.receipt_url;
    if (b.requests) {
      const match = b.requests.match(/\[Receipt:\s*([^\]]+)\]/i);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }

  const filtered = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            (status === "all" || b.status === status) &&
            (roomType === "all" || b.roomType === roomType) &&
            (q === "" ||
              b.guest.toLowerCase().includes(q.toLowerCase()) ||
              b.id.toString().toLowerCase().includes(q.toLowerCase())),
        )
        .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()),
    [bookings, q, roomType, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const uniqueRoomTypes = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.roomType))),
    [bookings],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Front Office</p>
          <h1 className="mt-2 font-serif text-4xl text-forest-deep">Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} of {bookings.length} reservations
          </p>
        </div>
        <a
          href="/book"
          className="inline-flex items-center gap-2 bg-forest-deep text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition"
        >
          <Plus className="h-4 w-4" /> New reservation
        </a>
      </div>

      <div className="bg-background border border-border p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search guest or reference…"
          className="flex-1 min-w-[220px] bg-transparent px-3 py-2 text-sm border border-border focus:border-gold outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition ${
                status === s
                  ? "bg-forest-deep text-white border-forest-deep"
                  : "border-border hover:border-gold"
              }`}
            >
              {s.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[150px] border-l border-border pl-3">
          <select
            value={roomType}
            onChange={(e) => {
              setRoomType(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent px-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground outline-none"
          >
            <option value="all">ALL ROOM TYPES</option>
            {uniqueRoomTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div
          className="border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
          role="alert"
        >
          Could not load reservations: {error.message}
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Loading reservations...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-background border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3">Ref</th>
                  <th className="text-left px-6 py-3">Guest</th>
                  <th className="text-left px-6 py-3">Room</th>
                  <th className="text-left px-6 py-3">Check-in</th>
                  <th className="text-left px-6 py-3">Check-out</th>
                  <th className="text-center px-6 py-3">Guests</th>
                  <th className="text-left px-6 py-3">Payment & Receipt</th>
                  <th className="text-right px-6 py-3">Total</th>
                  <th className="text-left px-6 py-3">Status & Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((b) => {
                  const receiptUrl = getReceiptUrl(b);
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-6 py-3 font-mono text-xs">{b.ref || b.id}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-forest-deep">{b.guest}</div>
                        <div className="text-xs text-muted-foreground">{b.email}</div>
                        {b.phone && <div className="text-[11px] text-muted-foreground">{b.phone}</div>}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{b.roomType}</div>
                        <div className="text-xs text-muted-foreground">#{b.room}</div>
                      </td>
                      <td className="px-6 py-3">{b.checkIn}</td>
                      <td className="px-6 py-3">{b.checkOut}</td>
                      <td className="px-6 py-3 text-center">{b.guests}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-medium capitalize">
                            {b.paymentMethod === "transfer"
                              ? "Bank Transfer (CBE)"
                              : b.paymentMethod === "onarrival"
                                ? "Pay on Arrival"
                                : b.paymentMethod === "chapa"
                                  ? "Online (Chapa)"
                                  : b.paymentMethod || b.source}
                          </span>
                          {receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptBooking(b)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded bg-gold/15 text-gold-foreground border border-gold/40 hover:bg-gold hover:text-white transition-colors"
                            >
                              <FileText className="h-3 w-3" /> View Receipt
                            </button>
                          ) : b.paymentMethod === "transfer" ? (
                            <span className="text-[10px] text-muted-foreground italic">
                              No slip uploaded
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        ETB {b.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            aria-label={`Status for booking ${b.ref || b.id}`}
                            value={b.status}
                            onChange={(e) =>
                              updateStatus.mutate({
                                id: b.id,
                                nextStatus: e.target.value,
                              })
                            }
                            className={`${pill(b.status)} bg-transparent rounded cursor-pointer`}
                          >
                            {STATUSES.slice(1).map((option) => (
                              <option key={option} value={option}>
                                {option.replace("-", " ")}
                              </option>
                            ))}
                          </select>
                          {b.status === "pending" && b.paymentMethod === "transfer" && (
                            <button
                              type="button"
                              title="Approve Bank Transfer and Confirm Room (24h window)"
                              onClick={() =>
                                updateStatus.mutate({ id: b.id, nextStatus: "confirmed" })
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

          {updateStatus.error && (
            <p className="p-4 text-sm text-destructive">{updateStatus.error.message}</p>
          )}
        </div>
      )}

      {/* Bank Transfer Receipt Modal */}
      {viewingReceiptBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-gold" />
                <div>
                  <h3 className="font-serif text-lg text-forest-deep font-semibold">
                    Bank Transfer Receipt Verification
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Booking Ref: {viewingReceiptBooking.ref || `#${viewingReceiptBooking.id}`} · Account: 1000603302072 (CBE)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptBooking(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-muted/20 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Guest</span>
                  <span className="font-medium text-forest-deep">{viewingReceiptBooking.guest}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Room</span>
                  <span className="font-medium text-forest-deep">{viewingReceiptBooking.roomType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Amount Due</span>
                  <span className="font-bold text-forest-deep">ETB {viewingReceiptBooking.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Current Status</span>
                  <span className={pill(viewingReceiptBooking.status)}>{viewingReceiptBooking.status}</span>
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="rounded-xl border border-border bg-black/5 p-4 flex flex-col items-center justify-center min-h-[280px]">
                {(() => {
                  const url = getReceiptUrl(viewingReceiptBooking);
                  if (!url) {
                    return (
                      <p className="text-sm text-muted-foreground">No receipt file uploaded for this booking.</p>
                    );
                  }

                  const isPdf = url.toLowerCase().includes(".pdf");
                  if (isPdf) {
                    return (
                      <div className="text-center space-y-3 py-8">
                        <FileText className="h-12 w-12 text-forest-deep mx-auto" />
                        <p className="text-sm font-medium">PDF Document Receipt</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest-deep text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-gold hover:text-gold-foreground transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" /> Open PDF in New Tab
                        </a>
                      </div>
                    );
                  }

                  return (
                    <div className="w-full flex flex-col items-center gap-3">
                      <img
                        src={url}
                        alt="Transfer Receipt"
                        className="max-h-[50vh] max-w-full rounded-lg border border-border object-contain shadow-sm"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold hover:text-forest-deep underline underline-offset-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Full-Resolution Image
                      </a>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-900 leading-relaxed">
                <strong>24-Hour Approval Policy:</strong> Once you verify the deposit against account <strong>1000603302072</strong>, click <em>Approve & Confirm Room</em> below. This will transition the status to Confirmed and deduct 1 room from category availability.
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingReceiptBooking(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-border rounded hover:bg-muted text-muted-foreground"
              >
                Close
              </button>
              {viewingReceiptBooking.status !== "confirmed" && (
                <button
                  type="button"
                  onClick={() => {
                    updateStatus.mutate({
                      id: viewingReceiptBooking.id,
                      nextStatus: "confirmed",
                    });
                    setViewingReceiptBooking(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Confirm Room
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pill(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "checked-in": "bg-forest-deep text-white border-forest-deep",
    "checked-out": "bg-muted text-muted-foreground border-border",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
  };

  return `inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${map[status] ?? "bg-muted"}`;
}
