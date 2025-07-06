"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  UserPlus,
  UserMinus,
  Shield,
  Crown,
  MoreHorizontal,
  Mail,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllUsers, updateUserRole } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, USER_ROLES, User as UserType } from "@/lib/types";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";

interface PromoteDemoteDialogProps {
  user: any;
  action: "promote" | "demote";
  onConfirm: (userId: string, newRole: UserRole) => void;
  isLoading: boolean;
}

function PromoteDemoteDialog({
  user,
  action,
  onConfirm,
  isLoading,
}: PromoteDemoteDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (action === "promote") {
      const newRole = user.role === "user" ? "moderator" : "admin";
      onConfirm(user.id, newRole);
    } else {
      const newRole = user.role === "admin" ? "moderator" : "user";
      onConfirm(user.id, newRole);
    }
    setOpen(false);
  };

  const getDialogContent = () => {
    if (action === "promote") {
      const newRole = user.role === "user" ? "moderator" : "admin";
      return {
        title: "Promouvoir l'utilisateur",
        description: `Êtes-vous sûr de vouloir promouvoir ${getUserDisplayName(
          user
        )} au rôle de ${USER_ROLES[newRole]} ?`,
      };
    } else {
      const newRole = user.role === "admin" ? "moderator" : "user";
      return {
        title: "Rétrograder l'utilisateur",
        description: `Êtes-vous sûr de vouloir rétrograder ${getUserDisplayName(
          user
        )} au rôle de ${USER_ROLES[newRole]} ?`,
      };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {action === "promote" ? (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Promouvoir
            </>
          ) : (
            <>
              <UserMinus className="mr-2 h-4 w-4" />
              Rétrograder
            </>
          )}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogContent.title}</DialogTitle>
          <DialogDescription>{dialogContent.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === "demote" ? "destructive" : "default"}
            disabled={isLoading}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModeratorsManagement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { supabase: authSupabase } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { session },
        } = await authSupabase.auth.getSession();

        if (session?.user) {
          // Fetch user profile
          const { data } = await authSupabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setCurrentUser(data as UserType);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = authSupabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data } = await authSupabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setCurrentUser(data as UserType);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authSupabase]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAllUsers(supabase),
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(supabase, userId, role),
    onSuccess: (_, { role }) => {
      toast.success(`Rôle mis à jour vers ${USER_ROLES[role]}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error) => {
      console.error("Role update error:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    },
  });

  const handleRoleUpdate = (userId: string, newRole: UserRole) => {
    roleUpdateMutation.mutate({ userId, role: newRole });
  };

  // Filter users to show moderators and admins
  const moderationTeam =
    users?.filter(
      (user: any) => user.role === "moderator" || user.role === "admin"
    ) || [];

  // Filter regular users who could be promoted
  const regularUsers =
    users?.filter(
      (user: any) =>
        user.role === "user" &&
        (getUserDisplayName(user)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  // Filter moderation team based on search
  const filteredModerationTeam = moderationTeam.filter((user: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      getUserDisplayName(user).toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      user: "secondary" as const,
      moderator: "default" as const,
      admin: "destructive" as const,
    };
    return <Badge variant={variants[role]}>{USER_ROLES[role]}</Badge>;
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === "admin") return <Crown className="h-4 w-4 text-amber-500" />;
    if (role === "moderator")
      return <Shield className="h-4 w-4 text-blue-500" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminCount = moderationTeam.filter(
    (user: any) => user.role === "admin"
  ).length;
  const moderatorCount = moderationTeam.filter(
    (user: any) => user.role === "moderator"
  ).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administrateurs
            </CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Accès complet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modérateurs</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderatorCount}</div>
            <p className="text-xs text-muted-foreground">
              Modération des contenus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationTeam.length}</div>
            <p className="text-xs text-muted-foreground">Membres de l'équipe</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans l'équipe de modération..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Moderation Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Équipe de modération ({filteredModerationTeam.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Membre depuis</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModerationTeam.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.profile_picture_url}
                          alt={getUserDisplayName(user)}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="font-medium">
                            {getUserDisplayName(user)}
                          </div>
                          {user.username && (
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(user.created_at), {
                        locale: fr,
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {currentUser?.id !== user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {user.role === "moderator" && (
                            <PromoteDemoteDialog
                              user={user}
                              action="promote"
                              onConfirm={handleRoleUpdate}
                              isLoading={roleUpdateMutation.isPending}
                            />
                          )}

                          {user.role !== "user" && (
                            <PromoteDemoteDialog
                              user={user}
                              action="demote"
                              onConfirm={handleRoleUpdate}
                              isLoading={roleUpdateMutation.isPending}
                            />
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredModerationTeam.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Aucun membre trouvé"
                : "Aucun membre dans l'équipe"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promote Users Section */}
      {searchQuery && regularUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Utilisateurs à promouvoir ({regularUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscrit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.slice(0, 10).map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.profile_picture_url}
                            alt={getUserDisplayName(user)}
                          />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getUserDisplayName(user)}
                          </div>
                          {user.username && (
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(user.created_at), {
                          locale: fr,
                          addSuffix: true,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <PromoteDemoteDialog
                            user={user}
                            action="promote"
                            onConfirm={handleRoleUpdate}
                            isLoading={roleUpdateMutation.isPending}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
