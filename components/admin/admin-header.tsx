"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useServerAuth } from "@/components/layout/root-layout-client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User as UserType } from "@/lib/types";

export function AdminHeader() {
  const { profile } = useServerAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      toast.loading("Déconnexion en cours...");
      // Use server action for signout
      const { signOutAction } = await import("@/lib/actions/auth");
      const result = await signOutAction();
      
      toast.dismiss();
      
      if (result.success) {
        toast.success(result.message || "Déconnexion réussie !");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      toast.dismiss();
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return "A";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 max-w-full">
        <div className="flex items-center gap-3">
          <img src="/admin.png" className="w-auto h-10" alt="admin" />
          <div>
            <h1 className="text-lg font-semibold">Administration</h1>
            <p className="text-xs text-muted-foreground">BridgeYou.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/forum">
              Retour sur
              <img src="/logo-small.png" className="h-4 w-auto mr-0" alt="BridgeYou Logo" />
              BridgeYou.
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.profile_picture_url}
                    alt={profile?.first_name || "Admin"}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile?.username || "Administrateur"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  <Badge variant="outline" className="w-fit text-xs">
                    {profile?.role === "admin"
                      ? "Administrateur"
                      : "Modérateur"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <Icon icon="mdi-light:logout" className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
