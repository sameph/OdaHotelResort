import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ensureSupabase } from "@/lib/supabase";
import { getUserRole, type AdminRole } from "@/lib/admin-roles";

type Props = { children: (user: User, role: AdminRole) => ReactNode };

export function AdminLogin({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const client = ensureSupabase();
      client.auth.getSession().then(({ data }) => {
        const nextUser = data.session?.user ?? null;
        setUser(nextUser);
        setRole(nextUser ? getUserRole(nextUser) : null);
        setReady(true);
      });
      const listener = client.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setRole(nextUser ? getUserRole(nextUser) : null);
      });
      subscription = listener.data.subscription;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect to authentication.");
      setReady(true);
    }
    return () => subscription?.unsubscribe();
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: authError } = await ensureSupabase().auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const nextRole = getUserRole(data.user);
      if (!nextRole) {
        await ensureSupabase().auth.signOut();
        throw new Error(
          "This account does not have an admin role assigned. Please use an admin or receptionist account.",
        );
      }

      setUser(data.user);
      setRole(nextRole);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
      setUser(null);
      setRole(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReset() {
    setResetError(null);
    setResetSent(false);
    if (!email) {
      setResetError("Please enter your email above to receive a reset link.");
      return;
    }
    setResetSending(true);
    try {
      const { data, error } = await ensureSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : "/"}#/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e: any) {
      setResetError(e?.message ?? String(e));
    } finally {
      setResetSending(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <div className="w-full max-w-md border border-border bg-background p-8 text-sm text-muted-foreground shadow-luxury">
          Loading admin access…
        </div>
      </main>
    );
  }

  if (!user || !role) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <form
          onSubmit={signIn}
          className="w-full max-w-md bg-background border border-border p-8 shadow-luxury"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ODA Resort Hotel</p>
          <h1 className="mt-3 font-serif text-4xl text-forest-deep">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use an authorized admin or receptionist account to manage the hotel.
          </p>

          <label className="block mt-7 text-sm text-foreground">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
            />
          </label>

          <label className="block mt-4 text-sm text-foreground relative">
            Password
            <div className="flex items-center gap-2">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="mt-2 text-sm px-2 py-2 border border-border bg-transparent text-muted-foreground hover:bg-muted/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className="mt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={sendReset}
              disabled={resetSending}
              className="text-xs text-muted-foreground hover:underline"
            >
              {resetSending ? "Sending…" : "Forgot password?"}
            </button>
            {resetSent && (
              <div className="text-xs text-green-600">Reset link sent to your email.</div>
            )}
          </div>

          {resetError && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {resetError}
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            disabled={!ready || submitting}
            className="mt-6 w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return <>{children(user, role)}</>;
}
