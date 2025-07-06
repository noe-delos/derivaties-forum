"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminStats } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";

export function AnalyticsView() {
  const supabase = useSupabase();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchAdminStats(supabase),
    refetchInterval: 60000, // Refetch every minute
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
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const overviewCards = [
    {
      title: "Total Utilisateurs",
      value: stats.totalUsers,
      change: `+${stats.todayUsers} aujourd'hui`,
      icon: Users,
      color: "text-blue-600",
      changeColor:
        stats.todayUsers > 0 ? "text-green-600" : "text-muted-foreground",
    },
    {
      title: "Total Publications",
      value: stats.totalPosts,
      change: `+${stats.todayPosts} aujourd'hui`,
      icon: FileText,
      color: "text-green-600",
      changeColor:
        stats.todayPosts > 0 ? "text-green-600" : "text-muted-foreground",
    },
    {
      title: "Total Commentaires",
      value: stats.totalComments,
      change: `+${stats.todayComments} aujourd'hui`,
      icon: MessageSquare,
      color: "text-purple-600",
      changeColor:
        stats.todayComments > 0 ? "text-green-600" : "text-muted-foreground",
    },
    {
      title: "En Attente",
      value: stats.pendingPosts,
      change: "Publications à modérer",
      icon: TrendingUp,
      color: "text-orange-600",
      changeColor: "text-orange-600",
    },
  ];

  const growthRate =
    stats.totalUsers > 0
      ? ((stats.todayUsers / stats.totalUsers) * 100).toFixed(1)
      : "0";
  const engagementRate =
    stats.totalPosts > 0
      ? (stats.totalComments / stats.totalPosts).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.changeColor}`}>{card.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Croissance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthRate}%</div>
            <p className="text-xs text-muted-foreground">
              Nouveaux utilisateurs aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}</div>
            <p className="text-xs text-muted-foreground">
              Commentaires par publication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modération</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingPosts > 0 ? `${stats.pendingPosts}` : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Publications en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Résumé d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Nouveaux utilisateurs
                </span>
                <Badge variant="secondary">{stats.todayUsers}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.todayUsers / Math.max(stats.totalUsers * 0.1, 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Nouvelles publications
                </span>
                <Badge variant="secondary">{stats.todayPosts}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.todayPosts / Math.max(stats.totalPosts * 0.1, 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Nouveaux commentaires
                </span>
                <Badge variant="secondary">{stats.todayComments}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.todayComments /
                        Math.max(stats.totalComments * 0.1, 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
              <div>
                <p className="text-sm font-medium">
                  Croissance des utilisateurs
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.todayUsers > 0
                    ? `${stats.todayUsers} nouveaux utilisateurs aujourd'hui, soit une croissance de ${growthRate}%`
                    : "Aucun nouvel utilisateur aujourd'hui"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div>
                <p className="text-sm font-medium">Activité de publication</p>
                <p className="text-xs text-muted-foreground">
                  {stats.todayPosts > 0
                    ? `${stats.todayPosts} nouvelles publications aujourd'hui`
                    : "Aucune nouvelle publication aujourd'hui"}
                </p>
              </div>
            </div>

            {stats.pendingPosts > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Action requise
                  </p>
                  <p className="text-xs text-orange-600">
                    {stats.pendingPosts} publication
                    {stats.pendingPosts > 1 ? "s" : ""} en attente de modération
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
