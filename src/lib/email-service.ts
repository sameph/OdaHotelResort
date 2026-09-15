import nodemailer from "nodemailer";

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

function formatStayDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

export async function sendPaymentConfirmationEmail(
  toEmail: string,
  guestName: string,
  txRef: string,
  amount: number,
  checkIn: string,
  checkOut: string,
  roomName: string,
) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("SMTP_USER or SMTP_PASS is not set in .env. Email dispatch bypassed.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const cancelUrl = `${process.env.VITE_SITE_URL || "http://localhost:5173"}/api/bookings/cancel?ref=${txRef}`;
  const safeGuestName = escapeHtml(guestName);
  const safeReference = escapeHtml(txRef);
  const safeRoomName = escapeHtml(roomName);
  const formattedAmount = `Br ${Number(amount).toLocaleString()}`;
  const formattedCheckIn = formatStayDate(checkIn);
  const formattedCheckOut = formatStayDate(checkOut);

  const html = `
    <div style="margin:0; padding:24px 12px; background:#f6f3ed; font-family:Arial,Helvetica,sans-serif; color:#263b35;">
      <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e7dfcf;">
        <div style="padding:32px 38px 26px; background:#163c34; color:#ffffff; text-align:center;">
          <p style="margin:0 0 8px; color:#d5b66e; font-size:12px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">ODA Resort Hotel</p>
          <h1 style="margin:0; font-family:Georgia,serif; font-size:29px; font-weight:normal;">Your reservation is confirmed</h1>
        </div>
        <div style="padding:32px 38px 38px; font-size:15px; line-height:1.65;">
          <p style="margin:0 0 18px;">Dear ${safeGuestName},</p>
          <p style="margin:0 0 18px;">Thank you for choosing ODA Resort Hotel. We are pleased to confirm that we have received your payment of <strong>${formattedAmount}</strong> and your reservation is now confirmed.</p>
          <p style="margin:0 0 24px;">We look forward to welcoming you to Adama and making your stay a memorable one.</p>

          <div style="margin:0 0 26px; border:1px solid #e4dbc9; background:#fcfaf5;">
            <div style="padding:12px 18px; background:#efe7d7; color:#163c34; font-size:13px; font-weight:bold; letter-spacing:.7px; text-transform:uppercase;">Reservation details</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-size:14px;">
              <tr><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; color:#68766f; width:42%;">Confirmation number</td><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; font-weight:bold; color:#163c34;">${safeReference}</td></tr>
              <tr><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; color:#68766f;">Accommodation</td><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; font-weight:bold;">${safeRoomName}</td></tr>
              <tr><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; color:#68766f;">Check-in</td><td style="padding:13px 18px; border-bottom:1px solid #e8e1d4; font-weight:bold;">${escapeHtml(formattedCheckIn)}</td></tr>
              <tr><td style="padding:13px 18px; color:#68766f;">Check-out</td><td style="padding:13px 18px; font-weight:bold;">${escapeHtml(formattedCheckOut)}</td></tr>
            </table>
          </div>

          <h2 style="margin:0 0 10px; color:#163c34; font-family:Georgia,serif; font-size:21px; font-weight:normal;">Before you arrive</h2>
          <p style="margin:0 0 10px;">Check-in begins at 2:00 PM and check-out is by 12:00 PM. Please keep this confirmation number available when you arrive.</p>
          <p style="margin:0 0 24px;">Should your plans change, most rates allow cancellation up to 48 hours before arrival. Please contact us if you need assistance with your reservation.</p>

          <div style="padding:18px; border-left:3px solid #c5a45c; background:#f8f6f1;">
            <strong style="display:block; margin-bottom:4px; color:#163c34;">Need assistance?</strong>
            Our reservations team is happy to help at <a href="mailto:contactmanager@odaresortandhotel.com" style="color:#8a681f;">contactmanager@odaresortandhotel.com</a>.
          </div>

          <p style="margin:28px 0 0;">Warm regards,<br><strong>The ODA Resort Hotel Team</strong></p>
        </div>
        <div style="padding:18px 28px; background:#163c34; color:#dbe4df; text-align:center; font-size:12px; line-height:1.5;">ODA Resort Hotel &middot; Adama, Oromia, Ethiopia<br>This is a payment and reservation confirmation for reference ${safeReference}.</div>
      </div>
    </div>
  `;

  const text = `Dear ${guestName},\n\nThank you for choosing ODA Resort Hotel. We have received your payment of ${formattedAmount}, and your reservation is confirmed.\n\nReservation details\nConfirmation number: ${txRef}\nAccommodation: ${roomName}\nCheck-in: ${formattedCheckIn}\nCheck-out: ${formattedCheckOut}\n\nCheck-in begins at 2:00 PM and check-out is by 12:00 PM. Most rates allow cancellation up to 48 hours before arrival.\n\nFor assistance, contact contactmanager@odaresortandhotel.com.\n\nWarm regards,\nThe ODA Resort Hotel Team`;

  // Let errors throw naturally so the caller knows it failed
  await transporter.sendMail({
    from: `"ODA Resort Hotel" <${user}>`,
    to: toEmail,
    subject: `Reservation confirmed — ODA Resort Hotel (${txRef})`,
    html,
    text,
  });
  console.log(`Confirmation email successfully sent via SMTP to ${toEmail}`);
}
