import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import type { User } from "@supabase/supabase-js";
import { useUserRoles } from "@/hooks/useUserRoles";

interface AppLayoutProps {
  user: User;
}

export function AppLayout({ user }: AppLayoutProps) {
  const { roles, primaryRole, loading } = useUserRoles(user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        roles={roles}
        primaryRole={primaryRole}
        userEmail={user.email ?? null}
      />
      <main className="flex-1 overflow-x-hidden">
        {loading ? (
          <div className="flex h-screen items-center justify-center text-muted-foreground">
            Chargement…
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
