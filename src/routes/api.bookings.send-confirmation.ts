import { createFileRoute } from "@tanstack/react-router";
import { sendBookingConfirmationEmail } from "@/lib/email-service.server";

export const Route = createFileRoute("/api/bookings/send-confirmation")({
  component: () => null,
  loader: async ({ params }) => params,
  beforeLoad: async () => undefined,
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      guest?: string;
      txRef?: string;
      amount?: number;
      checkIn?: string;
      checkOut?: string;
      roomName?: string;
    };

    // Validate required fields
    if (
      !body.email ||
      !body.guest ||
      !body.txRef ||
      !body.amount ||
      !body.checkIn ||
      !body.checkOut ||
      !body.roomName
    ) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Send confirmation email
    const emailSent = await sendBookingConfirmationEmail({
      email: body.email,
      guest: body.guest,
      txRef: body.txRef,
      amount: body.amount,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      roomName: body.roomName,
    });

    if (!emailSent) {
      return Response.json({ error: "Failed to send confirmation email" }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Confirmation email sent successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to send confirmation email" },
      { status: 500 },
    );
  }
}
