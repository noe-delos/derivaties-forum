/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Home,
  TrendingUp,
  Coins,
  Users,
  BookOpen,
  Target,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { POST_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Feed",
    url: "/",
    icon: Home,
  },
  {
    title: "Populaire",
    url: "/populaire",
    icon: TrendingUp,
  },
];

const categoryIcons = {
  entretien_sales_trading: Building2,
  conseils_ecole: BookOpen,
  stage_summer_graduate: Users,
  quant_hedge_funds: Target,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { profile, isAuthenticated } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = React.useState(false);

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      {/* Logo Header */}
      <SidebarHeader>
        <div
          className="p-4 group relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link href="/" className="flex items-center justify-between">
            <Image
              src={isCollapsed ? "/logo-small.png" : "/logo.png"}
              alt="Logo"
              width={isCollapsed ? 32 : 120}
              height={isCollapsed ? 32 : 40}
              className={cn(
                "transition-all duration-200",
                isCollapsed ? "h-8 w-8" : "h-8 w-auto"
              )}
              priority
            />

            {/* Collapse/Expand trigger */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                  isHovered && "opacity-100"
                )}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </Link>

          {/* Expand trigger for collapsed state */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                "absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity",
                "flex items-center justify-center"
              )}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Catégories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(POST_CATEGORIES).map(([key, label]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons];
                const isActive = pathname === `/categories/${key}`;

                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={`/categories/${key}`}>
                        <Icon />
                        <span>{label as any}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isAuthenticated && profile && (
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Coins className="h-5 w-5 text-amber-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium">Mes tokens</span>
                  <Badge variant="secondary" className="w-fit">
                    {profile.tokens}
                  </Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
