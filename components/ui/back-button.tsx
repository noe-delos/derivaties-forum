"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <Icon icon="tabler:arrow-left" className="h-4 w-4" />
      <span>Retour</span>
    </Button>
  );
}
