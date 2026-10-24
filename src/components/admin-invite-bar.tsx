import { useState } from "react";
import { ensureSupabase } from "@/lib/supabase";

export function AdminInviteBar() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendInvite(e?: any) {
    if (e?.preventDefault) e.preventDefault();
    setMessage(null);
    if (!email) return setMessage("Enter an email");
    setSending(true);
    try {
      const client = ensureSupabase();
      const session = await client.auth.getSession();
      const token = session?.data?.session?.access_token ?? null;

      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, role: "receptionist" }),
      });
      const text = await res.text();
      let j: any = null;
      try {
        j = JSON.parse(text);
      } catch {}
      if (!res.ok) {
        const msg = j?.error || text || "Invite failed";
        throw new Error(msg);
      }
      setMessage("Invitation sent");
      setEmail("");
    } catch (err: any) {
      setMessage(err?.message ?? String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="px-3 py-3 border-t border-white/5" onSubmit={sendInvite}>
      <div className="text-[11px] text-white/80 mb-2">Invite receptionist</div>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="email@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white/90"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md px-3 py-2 bg-gold text-gold-foreground text-sm disabled:opacity-60"
        >
          {sending ? "Sending…" : "Invite"}
        </button>
      </div>
      {message && <div className="mt-2 text-xs text-white/80">{message}</div>}
    </form>
  );
}
