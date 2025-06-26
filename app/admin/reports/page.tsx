/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, AlertTriangle } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Signalements</h1>
        <p className="text-muted-foreground">
          Gérez les signalements et les violations des règles de la communauté
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Flag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Système de signalement</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Le système de signalement sera implémenté dans une prochaine
            version. Les utilisateurs pourront signaler les contenus
            inappropriés et les modérateurs pourront les traiter depuis cette
            interface.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Fonctionnalités à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Signalement de publications inappropriées</li>
              <li>• Signalement de commentaires offensants</li>
              <li>• Signalement d'utilisateurs problématiques</li>
              <li>• Interface de traitement des signalements</li>
              <li>• Historique des actions de modération</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-500" />
              Types de signalements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Contenu spam ou publicitaire</li>
              <li>• Harcèlement ou intimidation</li>
              <li>• Contenu inapproprié ou offensant</li>
              <li>• Informations fausses ou trompeuses</li>
              <li>• Violation des règles de la communauté</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
