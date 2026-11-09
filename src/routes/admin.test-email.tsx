import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { sendPaymentConfirmationEmail, renderBookingConfirmation } from "@/lib/email-service";

export const Route = createFileRoute("/admin/test-email")({
  component: TestEmailPage,
});

function TestEmailPage() {
  const [recipient, setRecipient] = useState("samuelephrem07@gmail.com");
  const [guestName, setGuestName] = useState("Abebe Kebede");
  const [roomName, setRoomName] = useState("King Mountain View Suite");
  const [txRef, setTxRef] = useState(`ODA-${Math.floor(100000 + Math.random() * 900000)}`);
  const [amount, setAmount] = useState(4500);
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; id?: string } | null>(
    null,
  );
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  // Re-generate preview HTML whenever inputs change
  useEffect(() => {
    let isCancelled = false;
    const updatePreview = async () => {
      try {
        const siteUrl = window.location.origin;
        const html = await renderBookingConfirmation({
          guestName,
          txRef,
          amount,
          checkIn,
          checkOut,
          roomName,
          cancelUrl: `${siteUrl}/api/bookings/cancel?ref=${txRef}`,
        });
        if (!isCancelled) {
          setPreviewHtml(html);
        }
      } catch (err) {
        console.warn("Could not generate email preview:", err);
      }
    };
    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [guestName, txRef, amount, checkIn, checkOut, roomName]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !recipient.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await sendPaymentConfirmationEmail(
        recipient,
        guestName,
        txRef,
        amount,
        checkIn,
        checkOut,
        roomName,
      );

      if (res.success) {
        setResult({
          success: true,
          message: `Booking confirmation email successfully dispatched via Resend!`,
          id: res.id,
        });
        toast.success(`Email sent to ${recipient}!`);
      } else {
        setResult({
          success: false,
          message: res.error || "Failed to send email. Check API key configuration.",
        });
        toast.error(res.error || "Failed to send email");
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "Unexpected network or transmission error.",
      });
      toast.error(err?.message || "Sending failed");
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateRef = () => {
    setTxRef(`ODA-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-forest-deep">
            <Mail className="h-6 w-6 text-gold" />
            <h1 className="font-serif text-2xl font-semibold">Resend & React Email Testing Console</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Test and preview live booking confirmation emails powered by React Email and Resend API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === "form"
                ? "bg-forest-deep text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Send Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-forest-deep text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </button>
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <div
          className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-medium">{result.message}</p>
            {result.id && (
              <p className="text-xs opacity-80">
                Resend Message ID: <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded">{result.id}</code>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className={`lg:col-span-6 space-y-4 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="font-medium text-sm text-foreground">Email Parameters</span>
              <button
                type="button"
                onClick={regenerateRef}
                className="text-xs text-forest hover:text-forest-deep flex items-center gap-1"
                title="Generate new booking reference"
              >
                <RefreshCw className="h-3 w-3" /> New Ref
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. guest@example.com"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  In Resend testing mode, send to your account email (<strong className="text-foreground">samuelephrem07@gmail.com</strong>).
                  To send to any guest email, verify your domain at{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forest underline inline-flex items-center gap-0.5"
                  >
                    resend.com/domains <ExternalLink className="h-3 w-3 inline" />
                  </a>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Booking Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Total (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-forest-deep text-white font-medium text-sm hover:bg-forest transition-colors shadow-sm disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Dispatching email...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Test Confirmation Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className={`lg:col-span-6 space-y-3 ${activeTab === "form" ? "hidden lg:block" : ""}`}>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Template Preview
              </span>
              <span className="text-[11px] text-muted-foreground">
                Subject: <strong className="text-foreground">Your Booking is Confirmed - {txRef}</strong>
              </span>
            </div>

            <div className="border border-border/80 rounded-lg overflow-hidden bg-slate-50 min-h-[500px]">
              {previewHtml ? (
                <iframe
                  title="React Email Live Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[520px] border-0"
                />
              ) : (
                <div className="grid place-items-center h-64 text-sm text-muted-foreground">
                  Generating React Email preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

