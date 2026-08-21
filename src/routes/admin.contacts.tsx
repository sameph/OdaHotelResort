import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { fetchContacts, updateContactStatus } from "@/lib/supabase-service";
import type { ContactRow } from "@/lib/supabase-types";

type ContactStatus = "unread" | "read" | "responded";

const STATUSES: (ContactStatus | "all")[] = ["all", "unread", "read", "responded"];

export const Route = createFileRoute("/admin/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery<ContactRow[], Error>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    placeholderData: [],
    retry: false,
  });
  
  const contacts = data ?? [];
  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) => updateContactStatus(id, nextStatus),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["contacts"] }); },
  });
  
  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (q === "" ||
            c.firstName.toLowerCase().includes(q.toLowerCase()) ||
            c.lastName.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase())),
      ).sort((a,b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [status, q, contacts]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Communication</p>
          <h1 className="mt-2 font-serif text-4xl text-forest-deep">Messages</h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} of {contacts.length} inquiries
          </p>
        </div>
      </div>

      <div className="bg-background border border-border p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1 min-w-[220px] bg-transparent px-3 py-2 text-sm border border-border focus:border-gold outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s as ContactStatus | "all")}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition ${
                status === s
                  ? "bg-forest-deep text-white border-forest-deep"
                  : "border-border hover:border-gold"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive" role="alert">
          Could not load contacts: {error.message}
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Loading messages...
        </div>
      ) : (
        <div className="bg-background border border-border overflow-x-auto">
          <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-left px-6 py-3 w-[40%]">Message</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const date = c.created_at ? new Date(c.created_at).toLocaleDateString() : '—';
              return (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-muted-foreground">{date}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-muted-foreground">{c.email} {c.phone && `• ${c.phone}`}</div>
                  </td>
                  <td className="px-6 py-3">{c.enquiry_type}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    <p className="line-clamp-2" title={c.message}>{c.message}</p>
                  </td>
                  <td className="px-6 py-3">
                    <select 
                      aria-label={`Status for message ${c.id}`} 
                      value={c.status} 
                      onChange={(e) => updateStatus.mutate({ id: c.id, nextStatus: e.target.value })} 
                      className={`${pill(c.status)} bg-transparent`}
                    >
                      {STATUSES.slice(1).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No messages found.</td></tr>
            )}
          </tbody>
          </table>
          {updateStatus.error && <p className="p-4 text-sm text-destructive">{updateStatus.error.message}</p>}
      </div>
      )}
    </div>
  );
}

function pill(status: string) {
  const map: Record<string, string> = {
    unread: "bg-red-50 text-red-800 border-red-200",
    read: "bg-amber-50 text-amber-800 border-amber-200",
    responded: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return `inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${map[status] ?? "bg-muted"}`;
}
