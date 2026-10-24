import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/invite/accept")({
  component: RedirectToAccept,
});

function RedirectToAccept() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      window.location.replace(`/accept-invite${search}${hash}`);
    }
  }, []);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">Redirecting to activation…</div>
  );
}
