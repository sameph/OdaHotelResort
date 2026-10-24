import { createClient } from "@supabase/supabase-js";
import { getUserRole } from "./admin-roles";
import { sendInvitationEmail } from "./email-service";

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function handleInvitationsApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Authenticate the requesting user via Bearer token
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing authorization token. Please sign in as an administrator." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server authentication misconfigured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const requester = userData.user;
  const requesterRole = getUserRole(requester);
  if (requesterRole !== "admin") {
    return new Response(
      JSON.stringify({ error: "Access denied. Only administrators can manage invitations." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // Route: GET /api/invitations (list current staff and pending invitations)
  if (request.method === "GET") {
    try {
      const listRes = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listRes.error) {
        return new Response(JSON.stringify({ error: listRes.error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const users = listRes.data.users ?? [];
      const staff = users
        .map((u) => {
          const role = getUserRole(u) || (u.user_metadata?.role as string) || null;
          return {
            id: u.id,
            email: u.email || "",
            role: role || "user",
            fullName: u.user_metadata?.full_name || u.user_metadata?.name || null,
            confirmed: !!u.email_confirmed_at,
            invitedAt: u.invited_at || null,
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at || null,
          };
        })
        .filter((u) => u.role === "admin" || u.role === "receptionist");

      return new Response(JSON.stringify({ staff }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "Failed to list staff" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Route: POST /api/invitations/revoke (remove role)
  if (request.method === "POST" && url.pathname.endsWith("/revoke")) {
    try {
      const body = await request.json().catch(() => ({}));
      const targetUserId = body?.userId;
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: null },
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, message: "Staff access revoked." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "Failed to revoke access" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Route: POST /api/invitations (create invitation for a receptionist)
  if (request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const email = (body?.email || "").toString().trim().toLowerCase();
      // Only front-desk accounts may be created here. Never accept a role from
      // the browser, which could otherwise turn this into an elevation path.
      const role = "receptionist";

      if (!email || !email.includes("@")) {
        return new Response(JSON.stringify({ error: "Please provide a valid email address." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Determine siteUrl dynamically: prefer request origin/header, then env, default to production domain
      let siteUrl = (
        body?.origin ||
        request.headers.get("origin") ||
        process.env.SITE_URL ||
        process.env.VITE_SITE_URL ||
        "https://odaresortandhotel.com"
      ).replace(/\/$/, "");

      // If origin header is missing protocol, add it
      if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
        const host =
          request.headers.get("x-forwarded-host") || request.headers.get("host") || siteUrl;
        const proto =
          request.headers.get("x-forwarded-proto") ||
          (host.includes("localhost") ? "http" : "https");
        siteUrl = `${proto}://${host}`;
      }

      const redirectTo = `${siteUrl}/accept-invite`;

      let inviteLink: string | null = null;
      let message = "";
      let existingAccount = false;

      // Generate invitation link using Supabase Admin Auth
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { role },
          redirectTo,
        },
      });

      if (linkError) {
        // If the user already registered, handle gracefully
        if (
          linkError.message?.toLowerCase().includes("already been registered") ||
          linkError.status === 422
        ) {
          existingAccount = true;
          // Find the user to update their role
          const listRes = await adminClient.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = listRes.data?.users?.find(
            (u) => (u.email || "").toLowerCase() === email,
          );

          if (existingUser) {
            // Update role in metadata
            await adminClient.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                ...(existingUser.user_metadata || {}),
                role,
              },
            });

            // Generate a magic link so they can easily set password / log in
            const recoveryRes = await adminClient.auth.admin.generateLink({
              type: "magiclink",
              email,
              options: {
                redirectTo,
              },
            });

            inviteLink = recoveryRes.data?.properties?.action_link || null;
            message = `Account already existed for ${email}. Role updated to ${role}.`;
          } else {
            return new Response(JSON.stringify({ error: linkError.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        } else {
          return new Response(JSON.stringify({ error: linkError.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        inviteLink = linkData?.properties?.action_link || null;
        message = `Invitation successfully created for ${email} as ${role}.`;
      }

      // Ensure the redirect_to parameter in the Supabase action link matches the intended destination
      if (inviteLink) {
        try {
          const parsed = new URL(inviteLink);
          parsed.searchParams.set("redirect_to", redirectTo);
          inviteLink = parsed.toString();
        } catch {
          // If the generated link cannot be parsed, preserve the original link.
        }
      }

      // Send branded invitation email
      let emailSent = false;
      if (inviteLink) {
        try {
          await sendInvitationEmail(email, inviteLink, "Receptionist");
          emailSent = true;
        } catch (mailErr) {
          console.warn("Could not dispatch invitation email:", mailErr);
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message,
          email,
          role,
          emailSent,
          inviteLink,
          existingAccount,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err: any) {
      console.error("Invitation error:", err);
      return new Response(
        JSON.stringify({ error: err?.message || "Failed to process invitation." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
