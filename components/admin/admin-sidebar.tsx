/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  Flag,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

interface AdminSidebarProps {
  userRole: UserRole;
}

const navigationItems = [
  {
    title: "Tableau de bord",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["moderator", "admin"],
  },
  {
    title: "Modération des posts",
    href: "/admin/posts",
    icon: FileText,
    roles: ["moderator", "admin"],
  },
  {
    title: "Commentaires",
    href: "/admin/comments",
    icon: MessageSquare,
    roles: ["moderator", "admin"],
  },
  {
    title: "Signalements",
    href: "/admin/reports",
    icon: Flag,
    roles: ["moderator", "admin"],
  },
  {
    title: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
    roles: ["moderator", "admin"],
  },
  {
    title: "Modérateurs",
    href: "/admin/moderators",
    icon: UserCheck,
    roles: ["admin"],
  },
  {
    title: "Statistiques",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["moderator", "admin"],
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
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {userRole === "admin" ? "Administration" : "Modération"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
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
