import { Suspense } from "react";
import HomePageContent from "./home-page-content";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 pt-10">Chargement...</div>}>
      <HomePageContent />
    </Suspense>
  );
}