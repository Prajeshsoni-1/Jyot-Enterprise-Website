import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loading } from "@/components/admin/ui";

// Client-side gate: the Supabase session lives in browser storage, so the
// server cannot read it. Real authorisation is enforced again server-side in
// every admin server function and by RLS in the database.
export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) navigate({ to: "/auth", replace: true });
      else setState("ok");
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (state === "checking") return <Loading label="Checking your access…" />;

  return <Outlet />;
}
