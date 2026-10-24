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
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Email dispatch bypassed.");
    return;
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

  const resend = new Resend(resendApiKey);

  const cancelUrl = `${siteUrl.replace(/\/$/, "")}/api/bookings/cancel?ref=${txRef}`;

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
      from: fromAddress,
      to: toEmail,
      subject: `Your Booking is Confirmed - ${txRef}`,
      html,
    });
    console.log(`Confirmation email queued for broadcast to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send confirmation email", err);
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
