import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { ensureSupabase } from "./lib/supabase";
import { handleInvitationsApi } from "./lib/invitations-server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Webhook endpoint for Chapa notifications
      try {
        const url = new URL(request.url);
        if (url.pathname === "/api/webhook/chapa" && request.method === "POST") {
          const supabase = ensureSupabase();

          // Read raw body and parse JSON
          let bodyText: string;
          try {
            bodyText = await request.text();
          } catch (e) {
            return new Response("Invalid body", { status: 400 });
          }

          let payload: any = null;
          try {
            payload = bodyText ? JSON.parse(bodyText) : {};
          } catch {
            // Some webhook providers send urlencoded forms; ignore for now
            payload = {};
          }

          // Extract transaction reference and status
          const txRef =
            payload.tx_ref ||
            payload.data?.tx_ref ||
            payload.data?.transaction?.tx_ref ||
            payload.transaction?.tx_ref ||
            null;
          const chapaStatus =
            payload.status || payload.data?.status || payload.transaction?.status || null;
          const transactionId =
            payload.transaction_id ||
            payload.data?.transaction_id ||
            payload.transaction?.id ||
            null;
          const amount =
            payload.amount || payload.data?.amount || payload.transaction?.amount || null;

          if (!txRef) {
            return new Response(JSON.stringify({ error: "missing tx_ref" }), { status: 400 });
          }

          // Determine new booking status
          const successStatuses = ["success", "paid", "completed"];
          const newStatus =
            chapaStatus && successStatuses.includes(String(chapaStatus).toLowerCase())
              ? "confirmed"
              : "pending";

          // Update booking matching ref
          try {
            const updates: any = {
              status: newStatus,
              // store transaction summary in requests field for traceability
              requests: JSON.stringify({
                chapa: {
                  tx_ref: txRef,
                  transaction_id: transactionId,
                  status: chapaStatus,
                  amount,
                },
              }),
            };

            const { error } = await supabase
              .from("bookings")
              .update(updates as never)
              .eq("ref", txRef);
            if (error) {
              console.error("Failed to update booking from webhook:", error.message || error);
              return new Response(JSON.stringify({ error: "db_update_failed" }), { status: 500 });
            }

            if (newStatus === "confirmed") {
              const { data: bookingData } = await supabase
                .from("bookings")
                .select("*")
                .eq("ref", txRef)
                .single();
              const booking = bookingData as any;
              if (booking) {
                try {
                  const { decrementRoomAvailability } = await import("./lib/supabase-service");
                  await decrementRoomAvailability(booking.roomSlug || booking.room, booking.roomType);
                } catch (e) {
                  console.warn("Could not decrement room availability from webhook:", e);
                }

                const { sendPaymentConfirmationEmail } = await import("./lib/email-service");
                await sendPaymentConfirmationEmail(
                  booking.email,
                  booking.guest,
                  txRef,
                  booking.total,
                  booking.checkIn,
                  booking.checkOut,
                  booking.roomType,
                );
              }
            }
          } catch (e) {
            console.error("Webhook handler error:", e);
            return new Response(JSON.stringify({ error: "handler_error" }), { status: 500 });
          }

          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
      } catch (e) {
        console.error("Webhook processing failure:", e);
      }

      const url = new URL(request.url);
      if (url.pathname === "/api/upload-receipt" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          if (!file) {
            return new Response(JSON.stringify({ error: "Missing file" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `receipts/${timestamp}-${safeName}`;

          const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const sUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          let client;
          if (sKey && sUrl) {
            const { createClient } = await import("@supabase/supabase-js");
            client = createClient(sUrl, sKey, { auth: { persistSession: false } });
          } else {
            const { ensureSupabase } = await import("./lib/supabase");
            client = ensureSupabase();
          }

          const { error: uploadError } = await client.storage
            .from("room-images")
            .upload(path, buffer, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });

          if (uploadError) {
            console.error("Receipt upload error:", uploadError.message);
            return new Response(JSON.stringify({ error: uploadError.message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          const { data: pubData } = client.storage.from("room-images").getPublicUrl(path);
          return new Response(JSON.stringify({ url: pubData.publicUrl }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err: any) {
          console.error("Failed to process receipt upload:", err);
          return new Response(JSON.stringify({ error: err?.message || "Upload failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      }

      if (url.pathname === "/api/invitations" || url.pathname.startsWith("/api/invitations/")) {
        return await handleInvitationsApi(request);
      }

      if (url.pathname === "/api/bookings/cancel") {
        const ref = url.searchParams.get("ref");
        if (!ref) return new Response("Missing booking reference", { status: 400 });
        const supabase = ensureSupabase();
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" } as never)
          .eq("ref", ref);
        if (error) return new Response("Failed to cancel booking", { status: 500 });
        return new Response(
          "<html><body style='font-family:sans-serif;text-align:center;padding:50px;'><h2>Booking Cancelled</h2><p>Your booking has been successfully cancelled. You may close this tab.</p></body></html>",
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
