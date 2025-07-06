"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { createCorrection } from "@/lib/services/corrections";
import { Post, User } from "@/lib/types";

interface CorrectionFormProps {
  post: Post;
  user: User | null;
  isAuthenticated: boolean;
  onSubmitted?: () => void;
}

export function CorrectionForm({
  post,
  user,
  isAuthenticated,
  onSubmitted,
}: CorrectionFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.error("Vous devez être connecté pour soumettre une correction");
      return;
    }

    if (!content.trim()) {
      toast.error("Veuillez entrer votre correction");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCorrection(
        {
          post_id: post.id,
          user_id: user.id,
          content: content.trim(),
        },
        isAuthenticated
      );

      setIsSubmitted(true);
      setContent("");
      toast.success("Correction soumise avec succès ! Elle sera examinée par un modérateur.");
      onSubmitted?.();
    } catch (error) {
      console.error("Error submitting correction:", error);
      toast.error("Erreur lors de la soumission de la correction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Connectez-vous pour soumettre une correction et gagner des tokens
          </p>
          <Button asChild>
            <a href="/auth/login">Se connecter</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Correction soumise !</h3>
          <p className="text-muted-foreground mb-4">
            Votre correction a été envoyée aux modérateurs pour révision.
            Vous recevrez une notification une fois qu'elle sera approuvée.
          </p>
          <Badge variant="secondary" className="mb-4">
            +15 tokens potentiels
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => setIsSubmitted(false)}
            className="mt-2"
          >
            Soumettre une autre correction
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="formkit:submit" className="h-5 w-5" />
              Soumettre une correction
            </CardTitle>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Aidez la communauté en fournissant une réponse détaillée à cette question.
              Les corrections approuvées vous rapportent des tokens !
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-sm">
            Gagnez jusqu'à 15 tokens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Rédigez votre correction ici... Soyez détaillé et précis dans vos réponses."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="min-h-[200px] rounded-xl resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                Caractères: {content.length}
              </p>
              {content.length < 50 && content.length > 0 && (
                <p className="text-sm text-amber-600">
                  Minimum 50 caractères recommandés
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-medium text-blue-900 mb-1">
              Conseils pour une bonne correction :
            </h4>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• Répondez à toutes les parties de la question</li>
              <li>• Utilisez des exemples concrets quand c'est possible</li>
              <li>• Structurez votre réponse de manière claire</li>
              <li>• Vérifiez l'exactitude de vos informations</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="py-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Icon icon="formkit:submit" className="h-4 w-4 mr-2" />
                  Soumettre la correction
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}