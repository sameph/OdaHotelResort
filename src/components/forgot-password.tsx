import { FormEvent, useState } from "react";
import { ensureSupabase } from "@/lib/supabase";

export function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error: resetError } = await ensureSupabase().auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) throw resetError;

      setMessage(
        "Password reset email sent. Check your inbox and follow the link to set a new password.",
      );
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-4 rounded-md border border-border bg-background p-4"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Forgot password</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the staff email and we’ll send a reset link.
        </p>
      </div>

      <label className="block text-sm text-foreground">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
          placeholder="receptionist@odaresort.com"
        />
      </label>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
