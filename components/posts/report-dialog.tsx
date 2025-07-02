/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam ou contenu non désiré" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "misinformation", label: "Informations incorrectes ou trompeuses" },
  { value: "harassment", label: "Harcèlement ou intimidation" },
  { value: "copyright", label: "Violation de droits d'auteur" },
  { value: "other", label: "Autre" },
];

export function ReportDialog({
  open,
  onOpenChange,
  postTitle,
}: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement the actual report API call
      // await reportPost({ postId, reason, details });

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Signalement envoyé avec succès");
      onOpenChange(false);

      // Reset form
      setReason("");
      setDetails("");
    } catch (error) {
      console.error("Error reporting post:", error);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler cette publication</DialogTitle>
          <DialogDescription>
            Pourquoi signalez-vous "{postTitle}" ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label htmlFor="reason">Raison du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((reasonOption) => (
                <div
                  key={reasonOption.value}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={reasonOption.value}
                    id={reasonOption.value}
                  />
                  <Label
                    htmlFor={reasonOption.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reasonOption.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Détails supplémentaires (optionnel)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "Envoi..." : "Signaler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
