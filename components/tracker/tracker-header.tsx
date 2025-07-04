"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserType } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";

interface TrackerHeaderProps {
  isAuthenticated: boolean;
  profile: UserType | null;
}

export function TrackerHeader({ isAuthenticated, profile }: TrackerHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      toast.loading("Déconnexion en cours...");

      const result = await signOutAction();

      toast.dismiss();

      if (result.success) {
        toast.success(result.message || "Déconnexion réussie !");
        router.push("/forum");
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
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 pr-7 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container pl-10">
        <div className="flex h-16 items-center gap-4 py-3">
          <div className="flex-1 pt-4">
            <h1 className="text-2xl font-medium text-foreground">
              Tracker stages.
            </h1>
            <h3 className="font-normal text-xs text-foreground/30">
              Suivez vos candidatures et stages en finance.
            </h3>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une candidature
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.profile_picture_url}
                        alt={profile?.first_name || "User"}
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
                          : profile?.username || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <Badge variant="secondary" className="text-xs">
                          {profile?.tokens || 0} tokens
                        </Badge>
                        {profile?.role !== "user" && (
                          <Badge variant="outline" className="text-xs">
                            {profile?.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/forum/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/forum/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  {(profile?.role === "moderator" ||
                    profile?.role === "admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/forum/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Administration</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">S&apos;inscrire</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}