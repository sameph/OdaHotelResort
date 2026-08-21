import { createServerFn } from "@tanstack/react-start";

export const initializeChapaPayment = createServerFn({ method: "POST" })
  .validator((data: {
    amount: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    tx_ref: string;
    title?: string;
    description?: string;
    return_url?: string;
  }) => data)
  .handler(async ({ data }) => {
    const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET_KEY) {
      throw new Error("Missing CHAPA_SECRET_KEY");
    }

    const payload = {
      amount: data.amount,
      currency: "ETB",
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      tx_ref: data.tx_ref,
      return_url: data.return_url || `${process.env.VITE_SITE_URL || "http://localhost:5173"}/book?ref=${data.tx_ref}`,
      customization: {
        title: data.title || "ODA Resort Booking",
        description: data.description || "Booking payment",
        logo: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/logo-dark.png"
      }
    };

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Chapa API Error:", errText);
      let errorMessage = "Failed to initialize Chapa payment.";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) {
          if (typeof parsed.message === 'object') {
            // Handle cases where message is an object like {"customization.title": ["Too long"]}
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
      } catch (e) {
         // Fallback if not JSON
         errorMessage = errText;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.status === "success" && result.data && result.data.checkout_url) {
      return { checkoutUrl: result.data.checkout_url };
    } else {
      throw new Error(result.message || "Invalid Chapa response");
    }
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
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`
        }
      });

      if (!response.ok) return { success: false };

      const result = await response.json();
      if (result.status === "success" || result.data?.status === "success") {
        const { ensureSupabase } = await import("./supabase");
        const supabase = ensureSupabase();
        await supabase.from("bookings").update({ status: "confirmed" } as never).eq("ref", data.tx_ref);
        return { success: true };
      }
    } catch {
       return { success: false };
    }
    
    return { success: false };
  });
