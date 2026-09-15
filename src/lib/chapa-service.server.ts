import { createServerFn } from "@tanstack/react-start";
import { quoteBooking } from "./booking-pricing";
import { getServerSupabase } from "./server-supabase";

const sanitizeChapaText = (value: string | undefined, fallback: string) => {
  const sanitized = (value ?? fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || fallback;
};

export const initializeChapaPayment = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email: string;
      first_name: string;
      last_name: string;
      phone_number?: string;
      tx_ref: string;
      title?: string;
      description?: string;
      return_url?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET_KEY) {
      throw new Error("Missing CHAPA_SECRET_KEY");
    }

    const supabase = getServerSupabase();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("ref", data.tx_ref)
      .single();
    if (bookingError || !booking)
      throw new Error("Booking not found. Please start your reservation again.");

    const quote = await quoteBooking(booking);
    const { error: quoteError } = await supabase
      .from("bookings")
      .update({
        room: quote.roomName,
        nights: Math.max(
          1,
          Math.round(
            (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
              86_400_000,
          ),
        ),
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
      })
      .eq("ref", data.tx_ref);
    if (quoteError)
      throw new Error("Could not confirm the current booking price. Please try again.");

    const payload = {
      amount: quote.total.toFixed(2),
      currency: "ETB",
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      tx_ref: data.tx_ref,
      customization: {
        title: sanitizeChapaText(data.title, "ODA Resort Booking"),
        description: sanitizeChapaText(data.description, `${quote.roomName} reservation`),
        logo: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/logo-dark.png",
      },
    };

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Chapa API Error:", errText);
      let errorMessage = "Failed to initialize Chapa payment.";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) {
          if (typeof parsed.message === "object") {
            const firstValue = Object.values(parsed.message)[0];
            if (Array.isArray(firstValue) && firstValue.length > 0) {
              errorMessage = String(firstValue[0]);
            } else {
              errorMessage = JSON.stringify(parsed.message);
            }
          } else {
            errorMessage = String(parsed.message);
          }
        }
      } catch {
        errorMessage = errText;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.status === "success" && result.data && result.data.checkout_url) {
      return { checkoutUrl: result.data.checkout_url };
    }

    throw new Error(result.message || "Invalid Chapa response");
  });

export const verifyChapaPayment = createServerFn({ method: "POST" })
  .validator((data: { tx_ref: string }) => data)
  .handler(async ({ data }) => {
    const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET_KEY) return { success: false };

    try {
      const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${data.tx_ref}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      });

      if (!response.ok) return { success: false };

      const result = await response.json();
      if (result.status === "success" || result.data?.status === "success") {
        const supabase = getServerSupabase();
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("*")
          .eq("ref", data.tx_ref)
          .single();
        const booking = bookingData as any;

        if (booking && booking.status !== "confirmed") {
          await supabase
            .from("bookings")
            .update({ status: "confirmed" } as never)
            .eq("ref", data.tx_ref);

          try {
            const { sendBookingConfirmationEmail } = await import("./email-service.server");
            await sendBookingConfirmationEmail({
              email: booking.email,
              guest: booking.guest,
              txRef: data.tx_ref,
              amount: booking.total,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              roomName: booking.room || booking.roomType || "Your Reserved Room",
            });
          } catch (e) {
            console.error("Verification email send error:", e);
          }
        }
        return { success: true };
      }
    } catch {
      return { success: false };
    }

    return { success: false };
  });
