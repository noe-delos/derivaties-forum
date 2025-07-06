/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { User as UserType, Bank } from "@/lib/types";
import { fetchBanks } from "@/lib/services/banks";
import { Loader2, ChevronDown, X, ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface AppSidebarProps {
  isAuthenticated: boolean;
  profile: UserType | null;
}

const navigationItems = [
  {
    title: "Forum",
    url: "/forum",
    icon: "solar:dialog-bold",
  },
  {
    title: "Tracker",
    url: "/tracker",
    icon: "lucide:radar",
  },
  {
    title: "Entreprises",
    url: "/forum/populaire",
    icon: "mingcute:building-4-fill",
    comingSoon: true,
  },
  {
    title: "Salaires",
    url: "/forum/populaire",
    icon: "tdesign:money-filled",
    comingSoon: true,
  },
  {
    title: "CVs",
    url: "/forum/populaire",
    icon: "pepicons-pencil:cv",
    comingSoon: true,
  },
];

const adminItems = [
  {
    title: "Analytics",
    url: "/forum/admin/analytics",
    icon: "mdi-light:chart-line",
  },
  {
    title: "Posts",
    url: "/forum/admin/posts",
    icon: "mdi-light:file-document",
  },
  {
    title: "Comments",
    url: "/forum/admin/comments",
    icon: "mdi-light:comment",
  },
  {
    title: "Users",
    url: "/forum/admin/users",
    icon: "mdi-light:account-group",
  },
  {
    title: "Mods",
    url: "/forum/admin/moderators",
    icon: "mdi-light:shield-account",
  },
];

const categoryItems = [
  {
    title: "Profile",
    key: "profile",
    icon: "fluent:person-20-filled",
    url: "/forum/profile",
  },
];

interface BankMultiSelectProps {
  banks: Bank[];
  selectedBanks: string[];
  onBankToggle: (bankId: string) => void;
  isLoading: boolean;
  onClear: () => void;
}

function BankMultiSelect({
  banks,
  selectedBanks,
  onBankToggle,
  isLoading,
  onClear,
}: BankMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedBankData = banks.filter((bank) =>
    selectedBanks.includes(bank.id)
  );

  const renderTrigger = () => {
    if (selectedBanks.length === 0) {
      return (
        <span className="text-muted-foreground text-sm">
          Sélectionner des banques
        </span>
      );
    }

    const displayBanks = selectedBankData.slice(0, 2);
    const remainingCount = selectedBankData.length - 2;

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Banques</span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          {displayBanks.map((bank) => (
            <div
              key={bank.id}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden"
            >
              <img
                src={bank.logo_url}
                alt={bank.name}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground ml-2">
          Chargement...
        </span>
      </div>
    );
  }

  return (
    <Select open={open} onOpenChange={setOpen}>
      <SelectTrigger
        className="w-full justify-between py-5 px-4 rounded-xl shadow-soft hover:cursor-pointer hover:bg-muted"
        onClick={() => setOpen(!open)}
      >
        {renderTrigger()}
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectTrigger>
      <SelectContent className="w-fit">
        <div className="max-h-[300px] overflow-y-auto">
          {banks.map((bank) => {
            const isSelected = selectedBanks.includes(bank.id);
            return (
              <div
                key={bank.id}
                className="relative flex w-full cursor-pointer items-center gap-3 rounded-sm py-1.5 px-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => onBankToggle(bank.id)}
              >
                <div className="flex items-center justify-center w-4 h-4 border border-muted-foreground/30 rounded-sm">
                  {isSelected && (
                    <Icon icon="mdi:check" className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={bank.logo_url}
                    alt={bank.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="flex-1 text-sm font-medium">{bank.name}</span>
              </div>
            );
          })}
        </div>
        {selectedBanks.length > 0 && (
          <>
            <div className="border-t my-1" />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="w-full text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            </div>
          </>
        )}
      </SelectContent>
    </Select>
  );
}

export function AppSidebar({ isAuthenticated, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = React.useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  const isCollapsed = state === "collapsed";

  // Fetch banks on component mount
  useEffect(() => {
    async function loadBanks() {
      try {
        const banksData = await fetchBanks();
        setBanks(banksData);
      } catch (error) {
        console.error("Error loading banks:", error);
      } finally {
        setBanksLoading(false);
      }
    }
    loadBanks();
  }, []);

  // Initialize selected banks from URL params
  useEffect(() => {
    const banksParam = searchParams.get("banks");
    if (banksParam) {
      setSelectedBanks(banksParam.split(","));
    }
  }, [searchParams]);

  const toggleBankFilter = (bankId: string) => {
    const newSelectedBanks = selectedBanks.includes(bankId)
      ? selectedBanks.filter((id) => id !== bankId)
      : [...selectedBanks, bankId];

    setSelectedBanks(newSelectedBanks);

    // Update URL with new bank filters
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedBanks.length > 0) {
      params.set("banks", newSelectedBanks.join(","));
    } else {
      params.delete("banks");
    }

    const url = `/forum${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url, { scroll: false });
  };

  return (
    <Sidebar collapsible="icon" className="w-[15rem]">
      {/* Logo Header */}
      <SidebarHeader>
        <div
          className="p-4 group relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link href="/forum" className="flex items-center justify-between">
            <img
              src={isCollapsed ? "/logo-small.png" : "/logo.png"}
              alt="Logo"
              className={cn(
                "transition-all duration-200 mx-auto",
                isCollapsed ? "h-8 w-auto" : "h-20 w-auto"
              )}
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
          <SidebarGroupLabel className="text-muted-foreground/80 pb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild={!item.comingSoon}
                      isActive={pathname === item.url && !item.comingSoon}
                      tooltip={isCollapsed && !item.comingSoon ? item.title : undefined}
                      className={cn(
                        "px-3 pl-5 py-2 transition-all duration-200",
                        item.comingSoon && " cursor-not-allowed",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      {item.comingSoon ? (
                        <Link
                          href={""}
                          className="flex flex-row items-center gap-3 justify-between w-full cursor-default"
                        >
                          <div className="flex items-center gap-2.5 opacity-30">
                            <Icon
                              icon={item.icon}
                              className="size-4 text-foreground/50"
                            />
                            {!isCollapsed && <span>{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <Badge
                              variant="destructive"
                              className="text-[0.6rem] bg-red-600/10 text-red-600"
                            >
                              coming soon!
                            </Badge>
                          )}
                        </Link>
                      ) : (
                        <Link href={item.url}>
                          <Icon
                            icon={item.icon}
                            className="size-5 text-foreground/50"
                          />
                          {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Show "Mes entretiens" as submenu under Forum when in forum app */}
                  {item.title === "Forum" &&
                    pathname.startsWith("/forum") &&
                    isAuthenticated && (
                      <SidebarMenuItem className={cn(
                        "transition-all duration-200",
                        isCollapsed ? "ml-0" : "ml-8"
                      )}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === "/forum/mes-entretiens"}
                          tooltip={isCollapsed ? "Mes entretiens" : undefined}
                          className={cn(
                            "px-3 pl-5 py-2 transition-all duration-200",
                            isCollapsed && "justify-center px-2 pl-2"
                          )}
                        >
                          <Link href="/forum/mes-entretiens">
                            <Icon
                              icon="majesticons:coins"
                              className="size-4 text-foreground/50"
                            />
                            {!isCollapsed && <span className="text-sm">Mes entretiens</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80 pb-5">
            Paramètres
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-0">
              {categoryItems.map((item: any) => {
                const href = profile ? `/forum/profile/${profile.id}` : `/forum/profile`;
                const isActive = pathname.startsWith('/forum/profile');

                return (
                  <SidebarMenuItem key={item.key} className="p-0">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={isCollapsed ? item.title : undefined}
                      className={cn(
                        "px-6 py-2 transition-all duration-200",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Link href={href} className="p-0">
                        <span className="font-medium text-foreground flex flex-row items-center gap-3">
                          <Icon
                            icon={item.icon}
                            className="text-foreground/50 size-4"
                          />
                          {!isCollapsed && item.title}
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
          <SidebarGroup className={cn(
            "group-data-[collapsible=icon]:px-0"
          )}>
            <SidebarGroupContent>
              {isCollapsed ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg transition-all duration-200",
                        "p-2 justify-center cursor-pointer"
                      )}>
                        <Icon
                          icon="majesticons:coins"
                          className="h-5 w-5 text-amber-600 transition-all duration-200"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      <p>Mes crédits: {profile.tokens}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className={cn(
                  "flex items-center gap-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg transition-all duration-200",
                  "p-3 border border-orange-200/50 dark:border-orange-800/50"
                )}>
                  <Icon
                    icon="majesticons:coins"
                    className="h-5 w-5 text-amber-600 transition-all duration-200"
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Mes crédits:
                    </span>
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      {profile.tokens}
                    </span>
                  </div>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
