import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { RedirectMessage } from "@/components/auth/redirect-message";
import { AuthRedirect } from "@/components/auth/auth-redirect";

export const metadata: Metadata = {
  title: "Connexion - DERIVATIVES",
  description: "Connectez-vous à votre compte DERIVATIVES",
};

export default function LoginPage() {
  return (
    <AuthRedirect requireAuth={false} redirectTo="/forum">
      <div className="min-h-screen flex p-6">
      {/* Left side - Gradient background with text */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Decorative waves */}
        <div className="absolute inset-0 opacity-30">
          <svg
            className="absolute bottom-0 left-0 right-0"
            viewBox="0 0 1440 320"
            fill="none"
          >
            <path
              fill="rgba(255,255,255,0.1)"
              d="M0,128L48,138.7C96,149,192,171,288,186.7C384,203,480,213,576,213.3C672,213,768,203,864,176C960,149,1056,107,1152,96C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-end pb-16 p-12 text-white">
          <div className="mb-8">
            <p className="text-sm font-medium tracking-wider opacity-80 mb-8">
              OPTEZ POUR L'EXCELLENCE
            </p>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Maîtrisez
              <br />
              La Finance
              <br />
              De Marché
            </h1>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              La finance de marché est notre cœur d'expertise et non un
              complément à notre gamme. Rejoignez l'excellence avec DERIVATIVES.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="DERIVATIVES Logo"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue</h2>
            <p className="text-gray-600">
              Entrez votre email et mot de passe pour accéder à votre compte
            </p>
          </div>

          <Suspense fallback={null}>
            <RedirectMessage />
          </Suspense>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="text-center">
            <p className="text-gray-600">
              Vous n'avez pas de compte ?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </AuthRedirect>
  );
}
