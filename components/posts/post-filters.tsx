import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POST_CATEGORIES = {
  entretien_sales_trading: "Entretiens Sales & Trading",
  conseils_ecole: "Conseils École",
  stage_summer_graduate: "Stages Summer/Graduate",
  quant_hedge_funds: "Quant & Hedge Funds",
} as const;

const CITIES = {
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

const POST_TYPES = {
  question: "Question",
  retour_experience: "Retour d'expérience",
  transcript_entretien: "Transcript d'entretien",
  fichier_attache: "Fichier attaché",
} as const;

export function PostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentCity = searchParams.get("city") || "";
  const currentType = searchParams.get("type") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Catégorie
            </label>
            <Select
              value={currentCategory}
              onValueChange={(value) => updateFilters("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {Object.entries(POST_CATEGORIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Ville
            </label>
            <Select
              value={currentCity}
              onValueChange={(value) => updateFilters("city", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les villes</SelectItem>
                {Object.entries(CITIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Type
            </label>
            <Select
              value={currentType}
              onValueChange={(value) => updateFilters("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                {Object.entries(POST_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Filtres actifs</h3>
        <div className="flex flex-wrap gap-2">
          {currentCategory && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilters("category", "")}
            >
              {POST_CATEGORIES[currentCategory as keyof typeof POST_CATEGORIES]}{" "}
              ×
            </Badge>
          )}
          {currentCity && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilters("city", "")}
            >
              {CITIES[currentCity as keyof typeof CITIES]} ×
            </Badge>
          )}
          {currentType && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilters("type", "")}
            >
              {POST_TYPES[currentType as keyof typeof POST_TYPES]} ×
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
