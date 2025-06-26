"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function RedirectMessage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  if (!redirectTo) return null;

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription>
        Vous devez être connecté pour accéder à cette page. Après connexion,
        vous serez redirigé vers votre destination.
      </AlertDescription>
    </Alert>
  );
}
