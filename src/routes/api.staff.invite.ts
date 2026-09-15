import { createFileRoute } from "@tanstack/react-router";
import { inviteStaffMember } from "@/lib/staff-invite.server";

export const Route = createFileRoute("/api/staff/invite")({
  component: () => null,
  loader: async ({ params }) => params,
  beforeLoad: async () => undefined,
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; role?: "admin" | "receptionist" };
    const response = await inviteStaffMember({
      data: { email: body.email ?? "", role: body.role ?? "receptionist" },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to invite staff member." },
      { status: 400 },
    );
  }
}
