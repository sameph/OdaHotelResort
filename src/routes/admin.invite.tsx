import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ensureSupabase } from "@/lib/supabase";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Shield,
  Users,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/admin/invite")({
  component: InvitePage,
});

type StaffMember = {
  id: string;
  email: string;
  role: "admin" | "receptionist" | string;
  fullName: string | null;
  confirmed: boolean;
  invitedAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

function InvitePage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Staff list state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  async function loadStaff() {
    try {
      setLoadingStaff(true);
      const client = ensureSupabase();
      const session = await client.auth.getSession();
      const token = session?.data?.session?.access_token ?? null;

      if (!token) return;

      const res = await fetch("/api/invitations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setStaff(json.staff ?? []);
      }
    } catch (err) {
      console.warn("Failed to load staff list:", err);
    } finally {
      setLoadingStaff(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLastInviteLink(null);
    setCopied(false);

    if (!email) {
      setMessage({ type: "error", text: "Please enter an email address." });
      return;
    }

    setSending(true);
    try {
      const client = ensureSupabase();
      const session = await client.auth.getSession();
      const token = session?.data?.session?.access_token ?? null;

      if (!token) {
        throw new Error("You must be logged in as an administrator to send invitations.");
      }

      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role: "receptionist",
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to dispatch invitation.");
      }

      setMessage({
        type: "success",
        text: json.message || `Invitation successfully created for ${email}.`,
      });

      if (json.inviteLink) {
        setLastInviteLink(json.inviteLink);
      }

      setEmail("");
      // Refresh staff list
      loadStaff();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || String(err) });
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    if (!lastInviteLink) return;
    try {
      await navigator.clipboard.writeText(lastInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
    }
  }

  async function handleRevoke(userId: string) {
    try {
      setRevokingId(userId);
      setConfirmDialog((d) => ({ ...d, isLoading: true }));
      const client = ensureSupabase();
      const session = await client.auth.getSession();
      const token = session?.data?.session?.access_token ?? null;

      const res = await fetch("/api/invitations/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success("Receptionist access revoked successfully.");
        loadStaff();
        setConfirmDialog((d) => ({ ...d, open: false }));
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Failed to revoke access");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke access");
    } finally {
      setRevokingId(null);
      setConfirmDialog((d) => ({ ...d, isLoading: false }));
    }
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.fullName && s.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
          Team & Access
        </p>
        <h1 className="mt-2 font-serif text-4xl text-forest-deep">Staff Invitations</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Invite receptionists to manage front-desk duties, reservations, guest folios, and
          check-ins. Receptionists have secure, dedicated access tailored to hotel operations.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Invite Form Card */}
        <div className="lg:col-span-5 bg-background border border-border p-6 md:p-8 shadow-luxury">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-forest-deep text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-forest-deep">Send Invitation</h2>
              <p className="text-xs text-muted-foreground">New receptionist onboarding</p>
            </div>
          </div>

          <form onSubmit={sendInvite} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-forest-deep font-medium mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="receptionist@odaresortandhotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border bg-background px-3 py-2.5 pl-9 text-sm outline-none focus:border-gold transition-colors"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="border border-forest-deep/20 bg-forest-deep/5 p-3">
              <div className="text-xs font-semibold text-forest-deep">Receptionist access</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Bookings, rooms, and guest records. This invitation cannot grant administrator
                access.
              </div>
            </div>

            {message && (
              <div
                className={`p-3 text-xs rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {lastInviteLink && (
              <div className="p-3.5 bg-forest-deep/5 border border-forest-deep/15 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-forest-deep">
                    Direct Activation Link
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Share via WhatsApp / Chat
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={lastInviteLink}
                    className="flex-1 bg-background border border-border px-2.5 py-1.5 text-xs text-foreground font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-gold text-gold-foreground text-xs font-medium rounded hover:bg-forest-deep hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] font-medium text-white hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sending Invitation…</span>
                </>
              ) : (
                <span>Dispatch Invitation Email</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Staff & Receptionists List */}
        <div className="lg:col-span-7 bg-background border border-border p-6 md:p-8 shadow-luxury">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-serif text-xl text-forest-deep">Authorized Staff</h2>
              <p className="text-xs text-muted-foreground">
                {staff.length} team members with console access
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter staff…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 bg-background border border-border px-2.5 py-1.5 pl-8 text-xs outline-none focus:border-gold"
                />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <button
                type="button"
                onClick={loadStaff}
                disabled={loadingStaff}
                title="Refresh staff list"
                className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingStaff ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border">
            {loadingStaff ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading team members…
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No staff members found matching your search.
              </div>
            ) : (
              filteredStaff.map((member) => {
                const isAdmin = member.role === "admin";
                const isConfirmed = member.confirmed;

                return (
                  <div
                    key={member.id}
                    className="py-3.5 flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-full grid place-items-center font-serif text-sm shrink-0 ${
                          isAdmin
                            ? "bg-gold/20 text-gold-foreground border border-gold/40"
                            : "bg-forest-deep/10 text-forest-deep border border-forest-deep/20"
                        }`}
                      >
                        {(member.fullName || member.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {member.fullName || member.email}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                              isAdmin
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            }`}
                          >
                            {isAdmin ? "Admin" : "Receptionist"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          <span className="truncate">{member.email}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            {isConfirmed ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Invited</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Revoke Access",
                              description: `Are you sure you want to revoke receptionist access for ${member.fullName || member.email}? They will no longer be able to log in to the admin portal.`,
                              onConfirm: () => handleRevoke(member.id),
                            });
                          }}
                          disabled={revokingId === member.id}
                          title="Revoke receptionist access"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all text-xs"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Revoke Access"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}
