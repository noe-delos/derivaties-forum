"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Icon } from "@iconify/react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
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

  // Chart configurations
  const weeklyChartConfig = {
    users: {
      label: "Nouveaux utilisateurs",
      color: "hsl(var(--chart-1))",
    },
    posts: {
      label: "Publications",
      color: "hsl(var(--chart-2))",
    },
    comments: {
      label: "Commentaires",
      color: "hsl(var(--chart-3))",
    },
  };

  const categoryChartConfig = stats.categoryStats.reduce(
    (acc: any, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    },
    {}
  );

  const userGrowthChartConfig = {
    users: {
      label: "Nouveaux utilisateurs",
      color: "hsl(var(--chart-1))",
    },
    cumulative: {
      label: "Total utilisateurs",
      color: "hsl(var(--chart-2))",
    },
  };

  const statusChartConfig = stats.statusDistribution.reduce(
    (acc: any, item, index) => {
      acc[item.status] = {
        label: item.status,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    },
    {}
  );

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      change: `+${stats.todayUsers} aujourd'hui`,
      icon: "fa-solid:users",
      color: "text-blue-600",
    },
    {
      title: "Publications",
      value: stats.totalPosts,
      change: `+${stats.todayPosts} aujourd'hui`,
      icon: "material-symbols:post-rounded",
      color: "text-green-600",
    },
    {
      title: "Commentaires",
      value: stats.totalComments,
      change: `+${stats.todayComments} aujourd'hui`,
      icon: "material-symbols:comment",
      color: "text-purple-600",
    },
    {
      title: "Corrections",
      value: stats.totalCorrections,
      change: `${stats.pendingCorrections} en attente`,
      icon: "material-symbols:verified-rounded",
      color: "text-indigo-600",
    },
    {
      title: "Tokens",
      value: stats.totalTokensAwarded,
      change: "Tokens distribués",
      icon: "material-symbols:token",
      color: "text-yellow-600",
    },
    {
      title: "Upvotes",
      value: stats.totalUpvotes,
      change: "Total des votes",
      icon: "material-symbols:thumb-up",
      color: "text-emerald-600",
    },
    {
      title: "En attente",
      value: stats.pendingPosts,
      change: "Publications à modérer",
      icon: "material-symbols:pending",
      color: "text-orange-600",
    },
    {
      title: "Engagement",
      value: stats.engagementStats.averageCommentsPerPost,
      change: "Commentaires/post",
      icon: "material-symbols:trending-up",
      color: "text-rose-600",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post":
        return (
          <Icon
            icon="material-symbols:post-rounded"
            className="h-4 w-4 text-green-600"
          />
        );
      case "comment":
        return (
          <Icon
            icon="material-symbols:comment"
            className="h-4 w-4 text-blue-600"
          />
        );
      case "user":
        return (
          <Icon icon="fa-solid:users" className="h-4 w-4 text-purple-600" />
        );
      default:
        return <Icon icon="material-symbols:activity" className="h-4 w-4" />;
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {statCards.map((stat) => {
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon icon={stat.icon} className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Activity Chart */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mage:chart-fill" className="h-5 w-5" />
              Activité hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyChartConfig}>
              <BarChart data={stats.weeklyStats}>
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent payload={{}} />} />
                <Bar dataKey="users" fill="var(--color-users)" />
                <Bar dataKey="posts" fill="var(--color-posts)" />
                <Bar dataKey="comments" fill="var(--color-comments)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:pie-chart" className="h-5 w-5" />
              Statut des publications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig}>
              <PieChart>
                <Pie
                  data={stats.statusDistribution.map((item, index) => ({
                    ...item,
                    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
                  }))}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:trending-up" className="h-5 w-5" />
              Croissance des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userGrowthChartConfig}>
              <LineChart data={stats.userGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent payload={{}} />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--color-cumulative)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:category" className="h-5 w-5" />
              Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig}>
              <BarChart data={stats.categoryStats} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* City Distribution and Most Active Users */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:location-on" className="h-5 w-5" />
              Répartition par ville
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.cityStats.slice(0, 6).map((city, index) => (
                <div
                  key={city.city}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`,
                      }}
                    />
                    <span className="text-sm font-medium">{city.city}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{city.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="material-symbols:star" className="h-5 w-5" />
              Utilisateurs les plus actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.engagementStats.mostActiveUsers
                .slice(0, 5)
                .map((user, index) => (
                  <div
                    key={user.user}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{user.user}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {user.posts + user.comments}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.posts}P / {user.comments}C
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="material-symbols:activity" className="h-5 w-5" />
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
              <Icon icon="material-symbols:pending" className="h-5 w-5" />
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
                <Icon
                  icon="material-symbols:trending-up"
                  className="ml-2 h-4 w-4"
                />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
