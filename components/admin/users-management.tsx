"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Ban,
  UnlockKeyhole,
  Mail,
  Calendar,
  Coins,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchAllUsers, updateUserRole, banUser } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, USER_ROLES } from "@/lib/types";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";

interface UserActionDialogProps {
  user: any;
  action: "role" | "ban" | "unban";
  onConfirm: (userId: string, action: string, value?: any) => void;
  isLoading: boolean;
}

function UserActionDialog({
  user,
  action,
  onConfirm,
  isLoading,
}: UserActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(user.role);

  const handleConfirm = () => {
    if (action === "role") {
      onConfirm(user.id, "role", newRole);
    } else {
      onConfirm(user.id, action);
    }
    setOpen(false);
  };

  const getDialogContent = () => {
    switch (action) {
      case "role":
        return {
          title: "Modifier le rôle",
          description: `Changer le rôle de ${getUserDisplayName(user)}`,
          content: (
            <Select
              value={newRole}
              onValueChange={(value: UserRole) => setNewRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_ROLES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        };
      case "ban":
        return {
          title: "Bannir l'utilisateur",
          description: `Êtes-vous sûr de vouloir bannir ${getUserDisplayName(
            user
          )} ? Cette action empêchera l'utilisateur d'accéder au forum.`,
          content: null,
        };
      case "unban":
        return {
          title: "Débannir l'utilisateur",
          description: `Êtes-vous sûr de vouloir débannir ${getUserDisplayName(
            user
          )} ? L'utilisateur pourra à nouveau accéder au forum.`,
          content: null,
        };
      default:
        return { title: "", description: "", content: null };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {action === "role" && (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Changer le rôle
            </>
          )}
          {action === "ban" && (
            <>
              <Ban className="mr-2 h-4 w-4" />
              Bannir
            </>
          )}
          {action === "unban" && (
            <>
              <UnlockKeyhole className="mr-2 h-4 w-4" />
              Débannir
            </>
          )}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogContent.title}</DialogTitle>
          <DialogDescription>{dialogContent.description}</DialogDescription>
        </DialogHeader>
        {dialogContent.content && (
          <div className="py-4">{dialogContent.content}</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === "ban" ? "destructive" : "default"}
            disabled={isLoading}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManagement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { profile: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAllUsers(supabase),
  });

  const userActionMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      value,
    }: {
      userId: string;
      action: string;
      value?: any;
    }) => {
      switch (action) {
        case "role":
          return updateUserRole(supabase, userId, value);
        case "ban":
          return banUser(supabase, userId, true);
        case "unban":
          return banUser(supabase, userId, false);
        default:
          throw new Error("Unknown action");
      }
    },
    onSuccess: (_, { action, value }) => {
      const messages = {
        role: `Rôle mis à jour vers ${USER_ROLES[value as UserRole]}`,
        ban: "Utilisateur banni avec succès",
        unban: "Utilisateur débanni avec succès",
      };
      toast.success(messages[action as keyof typeof messages]);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error) => {
      console.error("User action error:", error);
      toast.error("Erreur lors de l'action sur l'utilisateur");
    },
  });

  const handleUserAction = (userId: string, action: string, value?: any) => {
    userActionMutation.mutate({ userId, action, value });
  };

  // Filter users based on search and role filter
  const filteredUsers =
    users?.filter((user: any) => {
      const matchesSearch =
        getUserDisplayName(user)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    }) || [];

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      user: "secondary" as const,
      moderator: "default" as const,
      admin: "destructive" as const,
    };
    return <Badge variant={variants[role]}>{USER_ROLES[role]}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {Object.entries(USER_ROLES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
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
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-500" />
                      {user.tokens}
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
                    {user.is_banned ? (
                      <Badge variant="destructive">Banni</Badge>
                    ) : (
                      <Badge variant="secondary">Actif</Badge>
                    )}
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

                          <UserActionDialog
                            user={user}
                            action="role"
                            onConfirm={handleUserAction}
                            isLoading={userActionMutation.isPending}
                          />

                          {user.is_banned ? (
                            <UserActionDialog
                              user={user}
                              action="unban"
                              onConfirm={handleUserAction}
                              isLoading={userActionMutation.isPending}
                            />
                          ) : (
                            <UserActionDialog
                              user={user}
                              action="ban"
                              onConfirm={handleUserAction}
                              isLoading={userActionMutation.isPending}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
