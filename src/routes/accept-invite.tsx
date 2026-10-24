import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ensureSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({
    meta: [
      { title: "Accept Invitation — ODA Resort Hotel" },
      { name: "description", content: "Activate your receptionist account for ODA Resort Hotel." },
    ],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const setInviteUser = (nextUser: User) => {
      if (!mounted) return;
      setUser(nextUser);
      setFullName((nextUser.user_metadata?.full_name as string) || "");
      setLoading(false);
    };

    async function initSession() {
      try {
        const client = ensureSupabase();

        // 1. Check if Supabase redirected with error in URL fragment or search params
        if (typeof window !== "undefined") {
          const hash = window.location.hash;
          const search = window.location.search;
          const params = new URLSearchParams(search);
          const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

          const errorDesc =
            hashParams.get("error_description") ||
            params.get("error_description") ||
            hashParams.get("error") ||
            params.get("error");

          if (errorDesc) {
            if (mounted) {
              setError(
                errorDesc.includes("expired")
                  ? "This invitation link has expired. Please ask your administrator to send a new invite."
                  : `Invitation error: ${errorDesc}`,
              );
              setLoading(false);
            }
            return;
          }

          // Supabase can redirect an invite using an OTP token or a PKCE code.
          // Both must establish a session before the receptionist can activate.
          const tokenHash = params.get("token_hash");
          const type = params.get("type");
          if (tokenHash && type === "invite") {
            const { data, error: verifyErr } = await client.auth.verifyOtp({
              token_hash: tokenHash,
              type: "invite",
            });
            if (verifyErr) {
              if (mounted) {
                setError(verifyErr.message || "Failed to verify invitation token.");
                setLoading(false);
              }
              return;
            }
            if (data?.user) {
              setInviteUser(data.user);
              return;
            }
          }

          const code = params.get("code");
          if (code) {
            const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              if (mounted) {
                setError(exchangeError.message || "Failed to verify invitation link.");
                setLoading(false);
              }
              return;
            }
            if (data?.user) {
              setInviteUser(data.user);
              return;
            }
          }
        }

        // 2. Check active session (Supabase automatically handles hash access_tokens)
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData?.session?.user) {
          setInviteUser(sessionData.session.user);
          return;
        }

        // 3. Listen to auth state changes in case hash processing takes a moment
        const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setInviteUser(session.user);
          }
        });
        unsubscribe = authListener.subscription.unsubscribe;

        // Timeout fallback
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 3000);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to initialize invitation.");
          setLoading(false);
        }
      }
    }

    initSession();
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  async function handleActivate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    try {
      const client = ensureSupabase();
      const role = (user?.user_metadata?.role as string) || "receptionist";

      const { data, error: updateError } = await client.auth.updateUser({
        password,
        data: {
          full_name: fullName.trim() || undefined,
          role,
        },
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Brief delay to display confirmation, then transition to admin
      setTimeout(() => {
        navigate({ to: "/admin" });
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to set password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-luxury">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-forest-deep border-t-transparent" />
          <p className="mt-4 font-serif text-lg text-forest-deep">Verifying invitation…</p>
          <p className="mt-1 text-xs text-muted-foreground">Preparing your receptionist account</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-luxury">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-forest-deep/10 text-forest-deep">
            <CheckCircle2 className="h-6 w-6 text-forest-deep" />
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gold">Setup complete</p>
          <h1 className="mt-2 font-serif text-3xl text-forest-deep">Account Activated</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your password has been saved. Welcome to the team!
          </p>
          <p className="mt-4 text-xs font-medium text-forest-deep animate-pulse">
            Redirecting to admin console…
          </p>
          <Link
            to="/admin"
            className="mt-6 inline-flex items-center gap-2 bg-forest-deep px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            Go to Admin Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
        <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-luxury">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gold">Invitation Notice</p>
          <h1 className="mt-2 font-serif text-3xl text-forest-deep">
            {error ? "Invitation Expired" : "Sign In Required"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {error ||
              "We could not find an active invitation in this link. The invitation may have already been used, or the link has expired."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/admin"
              className="w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              Sign In to Admin
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const roleName = user.user_metadata?.role === "admin" ? "Administrator" : "Receptionist";

  return (
    <main className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
      <div className="w-full max-w-md border border-border bg-background p-8 shadow-luxury">
        <div className="text-center">
          <span className="grid place-items-center mx-auto h-12 w-12 rounded-full border-2 border-gold font-serif italic text-2xl text-gold">
            O
          </span>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-gold">ODA Resort Hotel</p>
          <h1 className="mt-2 font-serif text-3xl text-forest-deep">Activate Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You have been invited as <strong className="text-forest-deep">{roleName}</strong>. Set
            your password to access the console.
          </p>
        </div>

        <div className="mt-6 rounded-md border border-forest-deep/15 bg-forest-deep/5 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Account</div>
          <div className="text-sm font-medium text-forest-deep truncate">{user.email}</div>
        </div>

        <form onSubmit={handleActivate} className="mt-6 space-y-4">
          <label className="block text-sm text-foreground">
            Full Name (optional)
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="e.g. Selamawit Bekele"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2.5 pl-9 text-sm outline-none focus:border-gold"
              />
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </label>

          <label className="block text-sm text-foreground">
            New Password
            <div className="relative mt-1">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-gold"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block text-sm text-foreground">
            Confirm Password
            <div className="relative mt-1">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2.5 pl-9 text-sm outline-none focus:border-gold"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </label>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-forest-deep py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-60 font-semibold"
          >
            {submitting ? "Saving Password…" : "Activate & Open Console"}
          </button>
        </form>
      </div>
    </main>
  );
}
