"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  contentType: 'interview' | 'correction';
  postTitle: string;
  userTokens: number;
  onPurchaseSuccess: () => void;
}

const COSTS = {
  interview: 5,
  correction: 10,
};

const LABELS = {
  interview: 'l\'entretien',
  correction: 'la correction',
};

export function PurchaseDialog({
  open,
  onOpenChange,
  postId,
  contentType,
  postTitle,
  userTokens,
  onPurchaseSuccess,
}: PurchaseDialogProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const supabase = createClient();

  const cost = COSTS[contentType];
  const label = LABELS[contentType];
  const hasEnoughTokens = userTokens >= cost;

  const handlePurchase = async () => {
    if (!hasEnoughTokens) {
      toast.error("Vous n'avez pas assez de tokens");
      return;
    }

    setIsPurchasing(true);
    
    try {
      // Call the purchase_content function
      const { data, error } = await supabase.rpc('purchase_content', {
        p_post_id: postId,
        p_content_type: contentType,
        p_tokens_cost: cost,
      });

      if (error) {
        console.error('Purchase error:', error);
        if (error.message.includes('Not enough tokens')) {
          toast.error("Vous n'avez pas assez de tokens");
        } else if (error.message.includes('Content already purchased')) {
          toast.error("Vous avez déjà acheté ce contenu");
        } else {
          toast.error("Erreur lors de l'achat");
        }
        return;
      }

      toast.success(`${contentType === 'interview' ? 'Entretien' : 'Correction'} acheté avec succès !`);
      onPurchaseSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error("Erreur lors de l'achat");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="majesticons:coins" className="h-5 w-5 text-amber-600" />
            Acheter {label}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div>
              Vous êtes sur le point d'acheter {label} pour :
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{postTitle}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cost breakdown */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
            <div className="flex items-center gap-2">
              <Icon icon="majesticons:coins" className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Coût</span>
            </div>
            <Badge variant="outline" className="gap-1 font-semibold">
              {cost} tokens
            </Badge>
          </div>

          {/* User token balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vos tokens</span>
            <div className="flex items-center gap-1">
              <Icon icon="majesticons:coins" className="h-4 w-4 text-amber-600" />
              <span className={`font-medium ${hasEnoughTokens ? 'text-green-600' : 'text-red-600'}`}>
                {userTokens}
              </span>
            </div>
          </div>

          {/* Balance after purchase */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Après achat</span>
            <div className="flex items-center gap-1">
              <Icon icon="majesticons:coins" className="h-4 w-4 text-amber-600" />
              <span className={`font-medium ${hasEnoughTokens ? 'text-foreground' : 'text-red-600'}`}>
                {hasEnoughTokens ? userTokens - cost : userTokens}
              </span>
            </div>
          </div>

          {!hasEnoughTokens && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/50">
              <p className="text-sm text-red-700 dark:text-red-300">
                Vous n'avez pas assez de tokens pour cet achat.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={!hasEnoughTokens || isPurchasing}
            className="gap-2"
          >
            {isPurchasing ? (
              <>
                <Icon icon="eos-icons:loading" className="h-4 w-4 animate-spin" />
                Achat en cours...
              </>
            ) : (
              <>
                <Icon icon="majesticons:coins" className="h-4 w-4" />
                Acheter ({cost} tokens)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}