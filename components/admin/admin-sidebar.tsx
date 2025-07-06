"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

interface AdminSidebarProps {
  userRole: UserRole;
}

const navigationItems = [
  {
    title: "Tableau de bord",
    href: "/forum/admin",
    icon: "mage:dashboard-fill",
    roles: ["moderator", "admin"],
  },
  {
    type: "section",
    title: "Forum",
    icon: "solar:dialog-bold",
    roles: ["moderator", "admin"],
  },
  {
    title: "Modération des posts",
    href: "/forum/admin/posts",
    icon: "material-symbols:post-rounded",
    roles: ["moderator", "admin"],
    isSubItem: true,
  },
  {
    title: "Corrections",
    href: "/forum/admin/corrections",
    icon: "material-symbols:verified-rounded",
    roles: ["moderator", "admin"],
    isSubItem: true,
  },
  {
    title: "Signalements",
    href: "/forum/admin/reports",
    icon: "mynaui:flag-solid",
    roles: ["moderator", "admin"],
    isSubItem: true,
  },
  {
    title: "Statistiques",
    href: "/forum/admin/analytics",
    icon: "mage:chart-fill",
    roles: ["moderator", "admin"],
    isSubItem: true,
  },
  {
    type: "section",
    title: "Tracker",
    icon: "lucide:radar",
    roles: ["moderator", "admin"],
  },
  {
    title: "Modération",
    href: "/tracker/admin/offers",
    icon: "tdesign:setting-1-filled",
    roles: ["moderator", "admin"],
    isSubItem: true,
  },
  {
    title: "Utilisateurs",
    href: "/forum/admin/users",
    icon: "fa-solid:users",
    roles: ["moderator", "admin"],
  },
  {
    title: "Modérateurs",
    href: "/forum/admin/moderators",
    icon: "ic:sharp-local-police",
    roles: ["admin"],
  },
];

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 border-r bg-muted/20 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="mdi-light:shield-check" className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {userRole === "admin" ? "Administration" : "Modération"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            {filteredItems.map((item, index) => {
              const isActive = pathname === item.href;

              if (item.type === "section") {
                return (
                  <li key={`${item.title}-${index}`} className="mt-6 first:mt-0">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Icon icon={item.icon} className="h-4 w-4" />
                      {item.title}
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.href || `${item.title}-${index}`}>
                  <Link
                    href={item.href as any}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      item.isSubItem && "ml-6",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon icon={item.icon} className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
