import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validLink, setValidLink] = useState(false);

  useEffect(() => {
    const initializeRecovery = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      try {
        if (code) {
          const { error: exchangeError } = await ensureSupabase().auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          setValidLink(true);
          return;
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await ensureSupabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
          setValidLink(true);
          return;
        }

        setError("This password reset link is invalid or has expired.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to validate the reset link.");
      }
    };

    void initializeRecovery();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await ensureSupabase().auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setMessage("Your password has been updated. You can now sign in to the admin console.");
      setNewPassword("");
      setConfirmPassword("");
      setValidLink(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
      <div className="w-full max-w-md bg-background border border-border p-8 shadow-luxury">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ODA Resort Hotel</p>
        <h1 className="mt-3 font-serif text-4xl text-forest-deep">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set a new password for your staff account.
        </p>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

        {!message && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-foreground">
              New password
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
                placeholder="At least 8 characters"
                disabled={!validLink}
              />
            </label>

            <label className="block text-sm text-foreground">
              Confirm new password
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
                placeholder="Repeat your new password"
                disabled={!validLink}
              />
            </label>

            <button
              type="submit"
              disabled={loading || !validLink}
              className="w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        {!message && validLink && (
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Secure reset link accepted
          </p>
        )}
      </div>
    </main>
  );
}
