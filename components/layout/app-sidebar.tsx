/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/lib/types";

interface AppSidebarProps {
  isAuthenticated: boolean;
  profile: UserType | null;
}

const navigationItems = [
  {
    title: "Accueil",
    url: "/",
    icon: "mage:home-fill",
  },
  {
    title: "Tendances",
    url: "/populaire",
    icon: "fluent:fire-24-filled",
  },
];

const adminItems = [
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: "mdi-light:chart-line",
  },
  {
    title: "Posts",
    url: "/admin/posts",
    icon: "mdi-light:file-document",
  },
  {
    title: "Comments",
    url: "/admin/comments",
    icon: "mdi-light:comment",
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: "mdi-light:account-group",
  },
  {
    title: "Mods",
    url: "/admin/moderators",
    icon: "mdi-light:shield-account",
  },
];

const categoryItems = [
  {
    title: "Entretiens S&T",
    key: "entretien_sales_trading",
    icon: "stash:headset-solid",
  },
  {
    title: "École",
    key: "conseils_ecole",
    icon: "map:university",
  },
  {
    title: "Stages",
    key: "stage_summer_graduate",
    icon: "material-symbols:badge-rounded",
  },
  {
    title: "Quant & HF",
    key: "quant_hedge_funds",
    icon: "tabler:math-max",
  },
];

export function AppSidebar({ isAuthenticated, profile }: AppSidebarProps) {
  const pathname = usePathname();
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
                <Icon icon="mdi-light:chevron-left" className="h-4 w-4" />
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
              <Icon icon="mdi-light:chevron-right" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="px-6 py-3"
                  >
                    <Link href={item.url}>
                      <Icon
                        icon={item.icon}
                        className="size-7 text-foreground/50"
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80">
            Catégories
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categoryItems.map((item) => {
                const isActive = pathname === `/categories/${item.key}`;

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="px-6"
                    >
                      <Link href={`/categories/${item.key}`}>
                        <Icon
                          icon={item.icon}
                          className="size-10 text-foreground/50"
                        />
                        <span className="font-medium text-foreground">
                          {item.title}
                        </span>
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
                <Icon
                  icon="mdi-light:coin"
                  className="h-5 w-5 text-amber-500"
                />
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
