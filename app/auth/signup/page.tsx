import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Inscription - DERIVATIVES",
  description: "Créez votre compte DERIVATIVES",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex p-6">
      {/* Left side - Gradient background with text */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 relative overflow-hidden rounded-2xl">
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
              d="M0,160L48,149.3C96,139,192,117,288,117.3C384,117,480,139,576,154.7C672,171,768,181,864,165.3C960,149,1056,107,1152,101.3C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-end pb-16 p-12 text-white">
          <div className="mb-8">
            <p className="text-sm font-medium tracking-wider opacity-80 mb-8">
              REJOIGNEZ L&apos;EXCELLENCE
            </p>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Démarrez
              <br />
              Votre Carrière
              <br />
              En Finance
            </h1>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              Rejoignez une communauté de professionnels passionnés de finance
              de marché et développez vos compétences avec les meilleurs experts
              du secteur.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Créer un compte
            </h2>
            <p className="text-gray-600">
              Rejoignez la communauté des professionnels de la finance de marché
            </p>
          </div>

          <SignupForm />

          <div className="text-center">
            <p className="text-gray-600">
              Déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
