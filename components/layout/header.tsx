/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  User,
  LogOut,
  Settings,
  PlusCircle,
  Sparkles,
  X,
  Loader2,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User as UserType,
  SearchFilters,
  POST_CATEGORIES,
  POST_TYPES,
  PostCategory,
  PostType,
  Bank,
} from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";
import { fetchBanks } from "@/lib/services/banks";
import { CITIES, cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

interface HeaderProps {
  isAuthenticated: boolean;
  profile: UserType | null;
  onSearch?: (
    query: string,
    filters: SearchFilters,
    isNaturalLanguage: boolean
  ) => void;
  popularTags?: string[];
}

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
  const [open, setOpen] = useState(false);

  const selectedBankData = banks.filter((bank) =>
    selectedBanks.includes(bank.id)
  );

  const renderTrigger = () => {
    if (selectedBanks.length === 0) {
      return <span className="text-muted-foreground text-sm">Banques</span>;
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
              className="w-4 h-4 rounded-full bg-muted flex items-center justify-center overflow-hidden"
            >
              <img
                src={bank.logo_url}
                alt={bank.name}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
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
      <div className="flex items-center justify-center py-2 px-3">
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
        className="w-fit justify-between py-2 px-3 rounded-lg shadow-soft hover:cursor-pointer hover:bg-muted"
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

export function Header({ isAuthenticated, profile, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "recent",
  });
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "recent";
    const nl = searchParams.get("nl") === "true";
    const banksParam = searchParams.get("banks");

    setSearchQuery(query);
    setFilters({
      category:
        category && Object.keys(POST_CATEGORIES).includes(category)
          ? (category as PostCategory)
          : undefined,
      type:
        type && Object.keys(POST_TYPES).includes(type)
          ? (type as PostType)
          : undefined,
      banks: banksParam ? banksParam.split(",") : undefined,
      sortBy: sort as "recent" | "popular" | "comments",
    });
    setIsNaturalLanguage(nl);
  }, [searchParams]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("🔍 Header search initiated:", {
      searchQuery: searchQuery.trim(),
      filters,
      isNaturalLanguage,
    });

    setIsSearching(true);

    // Update URL
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.banks && filters.banks.length > 0)
      params.set("banks", filters.banks.join(","));
    if (filters.sortBy && filters.sortBy !== "recent")
      params.set("sort", filters.sortBy);
    if (isNaturalLanguage) params.set("nl", "true");

    const url = `/${params.toString() ? `?${params.toString()}` : ""}`;
    console.log("🔗 Updating URL to:", url);
    router.push(url, { scroll: false });

    // Call parent search handler
    if (onSearch) {
      console.log("📞 Calling parent search handler...");
      await onSearch(searchQuery.trim(), filters, isNaturalLanguage);
      console.log("✅ Parent search handler completed");
    }

    setIsSearching(false);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    console.log("🔧 Filter change:", { oldFilters: filters, newFilters });
    setFilters(newFilters);
    // Trigger search immediately when filters change
    setTimeout(async () => {
      if (onSearch) {
        console.log("⚡ Auto-triggering search due to filter change...");
        setIsSearching(true);
        await onSearch(searchQuery.trim(), newFilters, isNaturalLanguage);
        setIsSearching(false);
        console.log("✅ Auto-search completed");
      }
    }, 0);
  };

  const handleNaturalLanguageToggle = (enabled: boolean) => {
    console.log("🤖 Natural language toggle:", enabled);
    setIsNaturalLanguage(enabled);
    if (searchQuery.trim() && onSearch) {
      console.log("⚡ Auto-triggering search due to NL toggle...");
      setIsSearching(true);
      onSearch(searchQuery.trim(), filters, enabled);
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const clearFilters = () => {
    console.log("🗑️ Clearing all filters and search");
    setFilters({});
    setSearchQuery("");
    setIsNaturalLanguage(false);
    router.push("/", { scroll: false });
    if (onSearch) {
      onSearch("", {}, false);
    }
  };

  const addTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      const newFilters = { ...filters, tags: [...currentTags, tag] };
      handleFilterChange(newFilters);
    }
  };

  const removeTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    const newFilters = {
      ...filters,
      tags: currentTags.filter((t) => t !== tag),
    };
    handleFilterChange(newFilters);
  };

  const addBankFilter = (bankId: string) => {
    const currentBanks = filters.banks || [];
    if (!currentBanks.includes(bankId)) {
      const newFilters = { ...filters, banks: [...currentBanks, bankId] };
      handleFilterChange(newFilters);
    }
  };

  const removeBankFilter = (bankId: string) => {
    const currentBanks = filters.banks || [];
    const newFilters = {
      ...filters,
      banks: currentBanks.filter((id) => id !== bankId),
    };
    handleFilterChange(newFilters);
  };

  const hasActiveFilters =
    Object.keys(filters).some((key) => {
      const value = filters[key as keyof SearchFilters];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }) || searchQuery.trim();

  const getBankName = (bankId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    return bank?.name || bankId;
  };

  const getBankLogo = (bankId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    return bank?.logo_url;
  };

  const handleSignOut = async () => {
    try {
      toast.loading("Déconnexion en cours...");

      // Use server action for signout
      const result = await signOutAction();

      toast.dismiss();

      if (result.success) {
        toast.success(result.message || "Déconnexion réussie !");
        router.push("/");
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
    <header className="sticky top-0 z-50 pr-7 w-full border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container pl-10">
        {/* Main Header Row */}
        <div className="flex h-16 items-center gap-4 py-3">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  isNaturalLanguage
                    ? "Posez votre question en langage naturel..."
                    : "Rechercher des discussions..."
                }
                className="pl-10 pr-12 h-12 py-3 rounded-2xl shadow-soft text-sm placeholder:text-muted-foreground/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />

              {/* Natural Language Toggle - Absolute positioned */}
              <button
                type="button"
                onClick={() => handleNaturalLanguageToggle(!isNaturalLanguage)}
                className={`absolute right-3 cursor-pointer top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isNaturalLanguage
                    ? "bg-purple-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                }`}
              >
                <Icon icon="octicon:sparkle-fill-16" className="size-4" />
              </button>

              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </form>
          </div>

          {/* Filter Selects */}
          <div className="flex items-center gap-3">
            {/* Bank Select */}
            <BankMultiSelect
              banks={banks}
              selectedBanks={filters.banks || []}
              onBankToggle={(bankId) => {
                const currentBanks = filters.banks || [];
                const newBanks = currentBanks.includes(bankId)
                  ? currentBanks.filter((id) => id !== bankId)
                  : [...currentBanks, bankId];
                handleFilterChange({ ...filters, banks: newBanks });
              }}
              isLoading={banksLoading}
              onClear={() => handleFilterChange({ ...filters, banks: [] })}
            />

            {/* Category Select */}
            <Select
              value={filters.category || "all"}
              onValueChange={(value) =>
                handleFilterChange({
                  ...filters,
                  category:
                    value === "all" ? undefined : (value as PostCategory),
                })
              }
            >
              <SelectTrigger className="w-fit py-2 px-3 rounded-lg shadow-soft hover:cursor-pointer hover:bg-muted">
                <SelectValue
                  placeholder="Catégories"
                  className={cn(
                    !filters.category && "text-muted-foreground/70"
                  )}
                />
                <ChevronDownIcon className="size-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Catégories</SelectItem>
                {Object.entries(POST_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {String(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Select */}
            <Select
              value={filters.city || "all"}
              onValueChange={(value) =>
                handleFilterChange({
                  ...filters,
                  city: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-fit py-2 px-3 rounded-lg shadow-soft hover:cursor-pointer hover:bg-muted">
                <SelectValue
                  placeholder="Villes"
                  className={cn(!filters.city && "text-muted-foreground/70")}
                />
                <ChevronDownIcon className="size-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Villes</SelectItem>
                {Object.entries(CITIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {String(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort/Time Select */}
            <Select
              value={filters.sortBy || "recent"}
              onValueChange={(value) =>
                handleFilterChange({
                  ...filters,
                  sortBy: value as "recent" | "popular" | "comments",
                })
              }
            >
              <SelectTrigger className="w-fit py-2 px-3 rounded-lg shadow-soft hover:cursor-pointer hover:bg-muted">
                <SelectValue
                  placeholder="Trier"
                  className={cn(
                    filters.sortBy === "recent" && "text-muted-foreground/70"
                  )}
                />
                <ChevronDownIcon className="size-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Récent</SelectItem>
                <SelectItem value="popular">Populaire</SelectItem>
                <SelectItem value="comments">Commenté</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filters.category ||
              filters.city ||
              filters.banks?.length ||
              (filters.sortBy && filters.sortBy !== "recent") ||
              searchQuery.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 h-8"
              >
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Publier
              </Link>
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.profile_picture_url}
                        alt={profile?.first_name || "User"}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.username || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <Badge variant="secondary" className="text-xs">
                          {profile?.tokens || 0} tokens
                        </Badge>
                        {profile?.role !== "user" && (
                          <Badge variant="outline" className="text-xs">
                            {profile?.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  {(profile?.role === "moderator" ||
                    profile?.role === "admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
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
