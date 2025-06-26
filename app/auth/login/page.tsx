/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RedirectMessage } from "@/components/auth/redirect-message";

export const metadata: Metadata = {
  title: "Connexion - Forum Finance",
  description: "Connectez-vous à votre compte Forum Finance",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Entrez vos identifiants pour accéder à votre compte
          </p>
        </div>

        <Suspense fallback={null}>
          <RedirectMessage />
        </Suspense>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/signup"
            className="underline underline-offset-4 hover:text-primary"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
