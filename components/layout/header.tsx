"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, Settings, PlusCircle } from "lucide-react";
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
import { NotificationsPopover } from "@/components/notifications/notifications-popover";

interface HeaderProps {
  isAuthenticated: boolean;
  profile: UserType | null;
  popularTags?: string[];
}

export function Header({ isAuthenticated, profile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine which app we're in based on the pathname
  const isTrackerApp = pathname.startsWith("/tracker");
  const isForumApp = pathname.startsWith("/forum");

  // Get the appropriate title and subtitle based on the app
  const getAppTitle = () => {
    if (isTrackerApp) {
      return {
        title: "Tracker de stages.",
        subtitle: "Suivez vos candidatures et gérez vos stages en finance.",
      };
    } else if (isForumApp) {
      return {
        title: "Forum entretiens.",
        subtitle: "Le forum BridgeYou des entretiens en finance.",
      };
    } else {
      return {
        title: "BridgeYou.",
        subtitle: "Votre plateforme carrière en finance.",
      };
    }
  };

  const { title, subtitle } = getAppTitle();

  const handleSignOut = async () => {
    try {
      toast.loading("Déconnexion en cours...");

      // Use server action for signout
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
        {/* Main Header Row */}
        <div className="flex h-16 items-center gap-4 py-3">
          {/* Title */}
          <div className="flex-1 pt-4">
            <h1 className="text-2xl font-medium text-foreground">{title}</h1>
            <h3 className=" font-normal text-xs text-foreground/30">
              {subtitle}
            </h3>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Show "Publier" button only for forum app */}
            {isForumApp && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/forum/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Publier
                </Link>
              </Button>
            )}

            {isAuthenticated && profile && (
              <NotificationsPopover userId={profile.id} />
            )}

            {/* User menu or auth buttons */}
            {isAuthenticated && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile.profile_picture_url}
                        alt={
                          profile.first_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile.username || "User"
                        }
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.first_name && profile.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <span className="text-yellow-600">⭐</span>
                          {profile.tokens}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {profile.role}
                        </Badge>
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
