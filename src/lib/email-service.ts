import { Resend } from "resend";

export async function sendPaymentConfirmationEmail(
  toEmail: string,
  guestName: string,
  txRef: string,
  amount: number,
  checkIn: string,
  checkOut: string,
  roomName: string,
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Email dispatch bypassed.");
    return;
  }
  const resend = new Resend(resendApiKey);

  const cancelUrl = `${process.env.VITE_SITE_URL || "http://localhost:5173"}/api/bookings/cancel?ref=${txRef}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a3c34;">
      <h2 style="color: #1a3c34; border-bottom: 2px solid #ceb373; padding-bottom: 10px;">Booking Confirmation</h2>
      <p>Dear ${guestName},</p>
      <p>Your payment of <strong>Br ${amount.toLocaleString()}</strong> has been successfully processed! Your booking is now confirmed.</p>
      
      <div style="background-color: #fcf9f2; padding: 20px; border: 1px solid #e2d8c3; border-radius: 4px; margin-top: 20px;">
        <h3 style="margin-top: 0;">Reservation Details:</h3>
        <ul style="list-style: none; padding-left: 0;">
          <li style="margin-bottom: 8px;"><strong>Reference ID:</strong> ${txRef}</li>
          <li style="margin-bottom: 8px;"><strong>Room:</strong> ${roomName}</li>
          <li style="margin-bottom: 8px;"><strong>Check-in:</strong> ${checkIn}</li>
          <li style="margin-bottom: 8px;"><strong>Check-out:</strong> ${checkOut}</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">If your plans change, you can easily cancel your booking prior to arrival by clicking the link below:</p>
      <a href="${cancelUrl}" style="display: inline-block; padding: 10px 15px; background-color: #9f1239; color: #ffffff; text-decoration: none; font-size: 14px; text-transform: uppercase; font-weight: bold; border-radius: 4px;">Cancel Booking</a>
      
      <p style="margin-top: 40px; font-size: 12px; color: #666;">We look forward to hosting you at ODA Resort Hotel!</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.SENDER_EMAIL || "onboarding@resend.dev",
      to: toEmail,
      subject: `Your Booking is Confirmed - ${txRef}`,
      html,
    });
    console.log(`Confirmation email queued for broadcast to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send confirmation email", err);
  }
}
