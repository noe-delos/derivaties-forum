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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    icon: "bi:camera-video-fill",
  },
  {
    title: "École",
    key: "conseils_ecole",
    icon: "basil:university-solid",
  },
  {
    title: "Stages",
    key: "stage_summer_graduate",
    icon: "solar:suitcase-bold",
  },
  {
    title: "Quant & HF",
    key: "quant_hedge_funds",
    icon: "solar:chart-bold",
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

    const url = `/${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url, { scroll: false });
  };

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
                        className="size-7 text-foreground/30"
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
          <SidebarGroupLabel className="text-muted-foreground/80 pb-5">
            Catégories
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-0">
              {categoryItems.map((item) => {
                const isActive = pathname === `/categories/${item.key}`;

                return (
                  <SidebarMenuItem key={item.key} className="p-0">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={"px-6 py-0"}
                    >
                      <Link href={`/categories/${item.key}`} className="p-0">
                        <span className="font-medium text-foreground flex flex-row items-center gap-3">
                          <Icon
                            icon={item.icon}
                            className="text-foreground/30 size-4"
                          />
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80 pb-3">
            Banques
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <BankMultiSelect
                banks={banks}
                selectedBanks={selectedBanks}
                onBankToggle={toggleBankFilter}
                isLoading={banksLoading}
                onClear={() => {
                  setSelectedBanks([]);
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("banks");
                  const url = `/${
                    params.toString() ? `?${params.toString()}` : ""
                  }`;
                  router.push(url, { scroll: false });
                }}
              />
            </div>
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
