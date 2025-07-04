"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Users,
  FileText,
  MessageSquare,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminStats } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";

export function AdminDashboard() {
  const supabase = useSupabase();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchAdminStats(supabase),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      change: `+${stats.todayUsers} aujourd'hui`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Publications",
      value: stats.totalPosts,
      change: `+${stats.todayPosts} aujourd'hui`,
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Commentaires",
      value: stats.totalComments,
      change: `+${stats.todayComments} aujourd'hui`,
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      title: "En attente",
      value: stats.pendingPosts,
      change: "Publications à modérer",
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "user":
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "post":
        return <Badge variant="secondary">Publication</Badge>;
      case "comment":
        return <Badge variant="outline">Commentaire</Badge>;
      case "user":
        return <Badge variant="default">Utilisateur</Badge>;
      default:
        return <Badge>Activité</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start space-x-3 p-3 rounded-lg border"
                >
                  <div className="mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityBadge(activity.type)}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          locale: fr,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      par {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {stats.pendingPosts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="h-5 w-5" />
              Actions requises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  {stats.pendingPosts} publication
                  {stats.pendingPosts > 1 ? "s" : ""} en attente de modération
                </p>
                <p className="text-xs text-orange-600">
                  Ces publications nécessitent votre attention
                </p>
              </div>
              <a
                href="/forum/admin/posts"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
              >
                Modérer
                <TrendingUp className="ml-2 h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
