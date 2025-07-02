/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// User utility functions for display names and initials
export function getUserDisplayName(user: any): string {
  if (!user) return "Utilisateur";

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  if (user.username) {
    return user.username;
  }

  return "Utilisateur";
}

export function getUserInitials(user: any): string {
  if (!user) return "U";

  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }

  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }

  return "U";
}

export const POST_CATEGORIES = {
  entretien_sales_trading: "Entretiens Sales & Trading",
  conseils_ecole: "Conseils École",
  stage_summer_graduate: "Stages Summer/Graduate",
  quant_hedge_funds: "Quant & Hedge Funds",
} as const;

export function getCategoryLabel(category: keyof typeof POST_CATEGORIES) {
  return POST_CATEGORIES[category] || category;
}

export const CITIES = {
  paris: "Paris",
  london: "Londres",
  new_york: "New York",
  hong_kong: "Hong Kong",
  singapore: "Singapour",
  dubai: "Dubaï",
  frankfurt: "Francfort",
  tokyo: "Tokyo",
  zurich: "Zurich",
  toronto: "Toronto",
} as const;

export function getCityLabel(city: string) {
  return (CITIES as Record<string, string>)[city] || city.replace("_", " ");
}
