import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "./BottomNav";
import { Loader } from "./Loader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AppShell = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setOnboarded(null); return; }
    supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle()
      .then(({ data }) => setOnboarded(data?.onboarded ?? false));
  }, [user, location.pathname]);

  if (loading) return <Loader label="Warming up" />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (onboarded === null) return null;
  if (!onboarded && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  if (onboarded && location.pathname === "/onboarding") return <Navigate to="/discover" replace />;

  return (
    <div className="min-h-screen relative">
      <div className="aurora-orb w-[400px] h-[400px] -top-20 -left-20 bg-primary/40" />
      <div className="aurora-orb w-[500px] h-[500px] top-1/3 -right-32 bg-secondary/30" />
      <div className="aurora-orb w-[350px] h-[350px] bottom-0 left-1/3 bg-accent/30" />
      <div className="relative z-10 pb-28">
        <Outlet />
      </div>
      {location.pathname !== "/onboarding" && !location.pathname.startsWith("/chat/") && <BottomNav />}
    </div>
  );
};
