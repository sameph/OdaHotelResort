import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import BookingConfirmation, {
  type BookingConfirmationProps,
} from "@/emails/BookingConfirmation";

export type { BookingConfirmationProps };

/**
 * Renders the React Email BookingConfirmation component to static HTML.
 */
export async function renderBookingConfirmation(
  props: BookingConfirmationProps,
): Promise<string> {
  return await render(React.createElement(BookingConfirmation, props));
}

export interface SendPaymentConfirmationParams {
  toEmail: string;
  guestName: string;
  txRef: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  roomName: string;
}

export async function sendPaymentConfirmationEmail(
  toEmail: string,
  guestName: string,
  txRef: string,
  amount: number,
  checkIn: string,
  checkOut: string,
  roomName: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // If running in browser environment, dispatch to server API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/send-booking-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail,
          guestName,
          txRef,
          amount,
          checkIn,
          checkOut,
          roomName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send confirmation email");
      }
      return { success: true, id: data.id };
    } catch (err: any) {
      console.warn("Client email dispatch error:", err.message);
      return { success: false, error: err.message };
    }
  }

  // Running on the server:
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Email dispatch bypassed.");
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.SENDER_EMAIL ||
    process.env.VITE_EMAIL_FROM ||
    "onboarding@resend.dev";

  const siteUrl = (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://odaresortandhotel.com"
  ).replace(/\/$/, "");

  const cancelUrl = `${siteUrl}/api/bookings/cancel?ref=${txRef}`;

  try {
    const html = await renderBookingConfirmation({
      guestName,
      txRef,
      amount,
      checkIn,
      checkOut,
      roomName,
      cancelUrl,
    });

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: fromAddress,
      to: toEmail,
      subject: `Your Booking is Confirmed - ${txRef} | ODA Resort`,
      html,
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Confirmation email sent via Resend to ${toEmail} (ID: ${result.data?.id})`);
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error("Failed to send confirmation email:", err);
    return { success: false, error: err?.message || "Internal sending failure" };
  }
}

export async function sendInvitationEmail(
  toEmail: string,
  acceptUrl: string,
  role = "Receptionist",
) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Invitation email bypassed.");
    return;
  }

  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.SENDER_EMAIL ||
    process.env.VITE_EMAIL_FROM ||
    "onboarding@resend.dev";

  const resend = new Resend(resendApiKey);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d8c3; border-radius: 8px; overflow: hidden; color: #1a3c34;">
      <div style="background-color: #0E4B3C; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.1em;">ODA RESORT HOTEL</h1>
        <p style="color: #D4AF37; margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em;">Staff & Reception Access</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #0E4B3C; font-size: 20px; margin-top: 0;">You're invited to join ODA Resort Hotel</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334e44;">
          An administrator has invited you to join the team as a <strong>${role}</strong>. You will be able to manage room reservations, guests, and daily reception operations.
        </p>

        <div style="background-color: #fcf9f2; border-left: 4px solid #D4AF37; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #1a3c34;">
            <strong>Assigned Role:</strong> ${role}<br />
            <strong>Account Email:</strong> ${toEmail}
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">
          Please click the button below to confirm your account and set your secure password:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background-color: #0E4B3C; color: #ffffff; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Set Password & Activate</a>
        </div>

        <p style="font-size: 12px; color: #718096; line-height: 1.5; margin-top: 24px; word-break: break-all;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${acceptUrl}" style="color: #0E4B3C;">${acceptUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2d8c3; margin: 28px 0 20px;" />

        <p style="font-size: 12px; color: #a0aec0; margin: 0; text-align: center;">
          ODA Resort Hotel &bull; Adama, Ethiopia &bull; If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: toEmail,
      subject: `Invitation to join ODA Resort Hotel as ${role}`,
      html,
    });
    console.log(`Invitation email queued for ${toEmail}`);
  } catch (err) {
    console.error("Failed to send invitation email", err);
  }
}
