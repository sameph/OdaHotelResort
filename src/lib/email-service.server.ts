import nodemailer from "nodemailer";

// Initialize transporter with SMTP credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface ConfirmationEmailData {
  email: string;
  guest: string;
  txRef: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  roomName: string;
}

export async function sendBookingConfirmationEmail(data: ConfirmationEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();

    // Format dates
    const checkInDate = new Date(data.checkIn).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const checkOutDate = new Date(data.checkOut).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Calculate nights
    const checkInMs = new Date(data.checkIn).getTime();
    const checkOutMs = new Date(data.checkOut).getTime();
    const nights = Math.ceil((checkOutMs - checkInMs) / (1000 * 60 * 60 * 24));

    // Format amount with currency
    const amountFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(data.amount);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #1a5d3a 0%, #2d7a4f 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #333;
        }
        .section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1a5d3a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 15px;
          color: #1a5d3a;
          font-weight: 500;
        }
        .booking-ref {
          background: #e8f5e9;
          border-left: 4px solid #1a5d3a;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #1a5d3a;
        }
        .summary-box {
          background: #f9f9f9;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .summary-row:last-child {
          margin-bottom: 0;
        }
        .summary-row.total {
          border-top: 2px solid #ddd;
          padding-top: 12px;
          font-weight: 600;
          font-size: 16px;
          color: #1a5d3a;
        }
        .info-box {
          background: #fffbea;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #333;
        }
        .info-box strong {
          color: #f59e0b;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #1a5d3a 0%, #2d7a4f 100%);
          color: white;
          padding: 12px 32px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          background: #f9f9f9;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .footer-link {
          color: #1a5d3a;
          text-decoration: none;
        }
        .divider {
          color: #ddd;
          margin: 24px 0;
        }
        ul {
          margin: 12px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Booking Confirmed</h1>
          <p>Your reservation at ODA Resort Hotel is confirmed</p>
        </div>

        <div class="content">
          <p class="greeting">Dear <strong>${data.guest}</strong>,</p>

          <p>Thank you for booking with ODA Resort Hotel! We're excited to welcome you. Your reservation has been confirmed and payment received.</p>

          <div class="booking-ref">
            Reference: ${data.txRef}
          </div>

          <div class="section">
            <div class="section-title">📋 Reservation Details</div>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Room</span>
                <span class="detail-value">${data.roomName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-in</span>
                <span class="detail-value">${checkInDate}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-out</span>
                <span class="detail-value">${checkOutDate}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Duration</span>
                <span class="detail-value">${nights} night${nights !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">💳 Payment Summary</div>
            <div class="summary-box">
              <div class="summary-row">
                <span>Room Total:</span>
                <span>${amountFormatted}</span>
              </div>
              <div class="summary-row total">
                <span>Amount Paid:</span>
                <span>${amountFormatted}</span>
              </div>
            </div>
          </div>

          <div class="info-box">
            <strong>📌 Important Information:</strong>
            <ul>
              <li>Check-in starts at 2:00 PM and check-out is at 12:00 PM</li>
              <li>Free cancellation up to 48 hours before arrival</li>
              <li>Please bring a valid ID at check-in</li>
              <li>For any questions, contact us at +251-116-215-775</li>
            </ul>
          </div>

          <p>If you need an early check-in or have any special requests, please reply to this email or contact our reservations team.</p>

          <div style="text-align: center;">
            <a href="https://odaresortandhotel.com" class="cta-button">View Booking</a>
          </div>

          <div class="divider">—————————————————————————————</div>

          <p style="font-size: 13px; color: #666;">
            <strong>ODA Resort Hotel</strong><br>
            Adama, Ethiopia<br>
            Phone: +251-116-215-775<br>
            Email: contactmanager@odaresortandhotel.com<br>
            Website: <a href="https://odaresortandhotel.com" class="footer-link">odaresortandhotel.com</a>
          </p>
        </div>

        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply directly to this email.</p>
          <p style="margin-top: 12px; color: #999;">
            © 2026 ODA Resort Hotel. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const textContent = `
ODA Resort Hotel - Booking Confirmation

Dear ${data.guest},

Thank you for booking with ODA Resort Hotel! Your reservation has been confirmed and payment received.

Reservation Reference: ${data.txRef}

RESERVATION DETAILS:
Room: ${data.roomName}
Check-in: ${checkInDate}
Check-out: ${checkOutDate}
Duration: ${nights} night${nights !== 1 ? "s" : ""}

PAYMENT SUMMARY:
Amount Paid: ${amountFormatted}

IMPORTANT INFORMATION:
- Check-in starts at 2:00 PM and check-out is at 12:00 PM
- Free cancellation up to 48 hours before arrival
- Please bring a valid ID at check-in
- For any questions, contact us at +251-116-215-775

If you need an early check-in or have any special requests, please reply to this email or contact our reservations team.

---

ODA Resort Hotel
Adama, Ethiopia
Phone: +251-116-215-775
Email: contactmanager@odaresortandhotel.com
Website: odaresortandhotel.com

© 2026 ODA Resort Hotel. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.SMTP_USER || "noreply@odaresortandhotel.com",
      to: data.email,
      subject: `Booking Confirmed - ODA Resort Hotel [${data.txRef}]`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}
