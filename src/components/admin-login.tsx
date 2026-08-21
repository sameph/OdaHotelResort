import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ensureSupabase } from "@/lib/supabase";

type Props = { children: (user: User) => ReactNode };

export function AdminLogin({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const client = ensureSupabase();
      client.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null);
        setReady(true);
      });
      const listener = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
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
      const { error: authError } = await ensureSupabase().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || !user) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <form onSubmit={signIn} className="w-full max-w-md bg-background border border-border p-8 shadow-luxury">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ODA Resort Hotel</p>
          <h1 className="mt-3 font-serif text-4xl text-forest-deep">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use an authorized Supabase account to manage the hotel.</p>
          <label className="block mt-7 text-sm text-foreground">Email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold" />
          </label>
          <label className="block mt-4 text-sm text-foreground">Password
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold" />
          </label>
          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
          <button disabled={!ready || submitting} className="mt-6 w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return <>{children(user)}</>;
}
