/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import { fetchBanks } from "@/lib/services/banks";
import { Bank } from "@/lib/types";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  const navigationItems = [
    {
      title: "Forum",
      url: "/forum",
      icon: "solar:dialog-bold",
    },
    {
      title: "Tracker",
      url: "/forum/populaire",
      icon: "lucide:radar",
    },
    {
      title: "Entreprises",
      url: "/forum/populaire",
      icon: "mingcute:building-4-fill",
    },
    {
      title: "Salaires",
      url: "/forum/populaire",
      icon: "tdesign:money-filled",
    },
    {
      title: "CVs",
      url: "/forum/populaire",
      icon: "pepicons-pencil:cv",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banksData = await fetchBanks();
        setBanks(banksData.slice(0, 5)); // Get first 5 banks for logos
      } catch (error) {
        console.error("Error loading banks:", error);
      }
    };
    loadBanks();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/logo-small.png"
                alt="BridgeYou"
                width={32}
                height={32}
                className="mr-2"
              />
              <h1
                className={`text-xl font-medium transition-colors duration-300 ${
                  scrolled ? "text-zinc-900" : "text-white"
                }`}
              >
                BridgeYou.
              </h1>
            </motion.div>

            {/* Centered Navigation */}
            <div className="hidden lg:flex items-center justify-center space-x-6 xl:space-x-8 flex-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`transition-colors duration-300 font-medium text-sm ${
                    scrolled
                      ? "text-zinc-700 hover:text-zinc-400"
                      : "text-white hover:text-zinc-300"
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/auth/login" className="hidden sm:block">
                <Button
                  variant="outline"
                  className={`transition-colors duration-300 text-sm ${
                    scrolled
                      ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      : "border-white text-white hover:bg-white hover:text-zinc-900"
                  }`}
                >
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-zinc-600 hover:bg-zinc-700 text-white text-xs sm:text-sm px-3 sm:px-4">
                  Inscription
                </Button>
              </Link>
            </div>

            <div className="sm:hidden">
              <Link href="/auth/login">
                <Button
                  size="sm"
                  variant="outline"
                  className={`transition-colors duration-300 text-sm ${
                    scrolled
                      ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      : "border-white text-white hover:bg-white hover:text-zinc-900"
                  }`}
                >
                  Connexion
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section with Dark Zinc Gradient */}
      <motion.section
        className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 relative overflow-hidden"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/40 to-zinc-800/40"></div>
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <Badge className="bg-zinc-600/20 text-zinc-300 border-zinc-400/30 mb-8">
                🚀 Accélère ta carrière professionnelle
              </Badge>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              La communauté{" "}
              <span className="bg-gradient-to-r from-zinc-300 to-zinc-100 bg-clip-text text-transparent">
                professionnelle
              </span>
              <br />
              qui transforme{" "}
              <span className="bg-gradient-to-r from-zinc-300 to-zinc-100 bg-clip-text text-transparent">
                l'avenir
              </span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg md:text-xl text-zinc-300 mb-8 max-w-4xl mx-auto px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Connecte-toi avec les professionnels leaders en Finance,
              Consulting et Technology.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Partage ton expérience, découvre les coulisses et évolue
              rapidement.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button
                size="lg"
                className="bg-zinc-700 hover:bg-zinc-600 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                Rejoindre la communauté →
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-zinc-900 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                Explorer le forum
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-4 text-zinc-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex -space-x-2">
                {banks.slice(0, 5).map((bank, index) => (
                  <div
                    key={bank.id}
                    className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white"
                  >
                    <img
                      src={bank.logo_url}
                      alt={bank.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ))}
              </div>
              <span className="text-sm font-semibold">
                +4000 expériences partagées
              </span>
            </motion.div>

            <motion.div
              className="flex justify-center gap-8 mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <div className="bg-zinc-800/50 backdrop-blur px-6 py-3 rounded-lg border border-zinc-700">
                <span className="text-white font-medium text-sm">Salaires</span>
              </div>
              <div className="bg-zinc-800/30 backdrop-blur px-6 py-3 rounded-lg border border-zinc-700">
                <span className="text-zinc-300 text-sm">
                  Retours d'expérience
                </span>
              </div>
              <div className="bg-zinc-800/30 backdrop-blur px-6 py-3 rounded-lg border border-zinc-700">
                <span className="text-zinc-300 text-sm">Tracker</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Professional Success Stories Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-zinc-50 to-white mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 px-4">
              Découvre{" "}
              <span className="bg-gradient-to-r from-zinc-600 to-zinc-400 bg-clip-text text-transparent">
                les opportunités
              </span>{" "}
              cachées
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 px-4">
            {[
              {
                company: "Goldman Sachs",
                description:
                  "Grâce aux retours de la communauté, j'ai décroché mon stage d'été en M&A.",
                logo: "🏦",
              },
              {
                company: "McKinsey & Company",
                description:
                  "Les conseils pratiques m'ont aidé à réussir mes case studies.",
                logo: "📊",
              },
              {
                company: "Google",
                description:
                  "L'entraide entre membres m'a permis de préparer efficacement mes entretiens tech.",
                logo: "💻",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="text-2xl mr-3">{item.logo}</div>
                      <h3 className="font-bold text-base text-zinc-900">
                        {item.company}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 rounded-2xl p-8 max-w-3xl mx-auto border border-zinc-200">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">
                Accède aux ressources
              </h3>
              <p className="text-sm text-zinc-700 mb-6">
                Templates, guides d'entretiens et retours d'expérience partagés
                par la communauté pour maximiser tes chances de réussite.
              </p>
              <Button className="bg-zinc-600 hover:bg-zinc-700 text-white text-sm">
                Explorer les ressources
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Reviews Section */}
      <section
        id="entreprises"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-zinc-50 via-white to-zinc-50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 px-4">
              Insights{" "}
              <span className="bg-gradient-to-r from-zinc-600 to-zinc-400 bg-clip-text text-transparent">
                authentiques
              </span>
            </h2>
            <p className="text-base text-zinc-600 max-w-3xl mx-auto px-4">
              Accède aux témoignages exclusifs de professionnels qui partagent
              leur réalité du terrain.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8 mb-12 px-4">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      A
                    </div>
                    <div>
                      <div className="font-semibold">3.2 sur 5</div>
                      <div className="text-sm text-zinc-600">Ambiance</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      Quant Trading
                    </div>
                    <div className="text-sm text-zinc-600">Jane Street</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-600">par Analyste en M&A</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      A
                    </div>
                    <div>
                      <div className="font-semibold">4.1 sur 5</div>
                      <div className="text-sm text-zinc-600">Ambiance</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      M&A Intern
                    </div>
                    <div className="text-sm text-zinc-600">Goldman Sachs</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-600">par Analyste en M&A</p>
              </Card>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {[
              { company: "Asset Management", firm: "AXA", color: "blue" },
              { company: "S&T Intern", firm: "BNP Paribas", color: "green" },
              {
                company: "Private Equity Intern",
                firm: "Blackstone",
                color: "gray",
              },
              {
                company: "Software Engineering Intern",
                firm: "Google",
                color: "red",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4 hover:shadow-lg transition-all duration-300">
                  <div
                    className={`w-10 h-10 bg-${item.color}-500 rounded-full flex items-center justify-center text-white font-bold mb-3`}
                  >
                    {item.firm.charAt(0)}
                  </div>
                  <div className="font-semibold text-xs">{item.company}</div>
                  <div className="text-xs text-zinc-600">{item.firm}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Salary Section */}
      <section
        id="salaires"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-zinc-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6">
                Notre{" "}
                <span className="bg-gradient-to-r from-zinc-600 to-zinc-400 bg-clip-text text-transparent">
                  Intelligence
                </span>
              </h2>
              <p className="text-base text-zinc-600 mb-6">
                Découvre les tendances salariales et les évolutions de carrière
                grâce à notre base de données collaborative.
              </p>
              <div className="bg-gradient-to-r from-zinc-600 to-zinc-500 rounded-2xl p-8 text-white mb-6">
                <h3 className="text-lg font-bold mb-4">Salaires par poste</h3>
                <p className="text-sm mb-4">
                  Découvre les salaires de plus de 800 entreprises en Stage,
                  Alternance, CDI dans les métiers de la Finance, du Conseil et
                  de la Tech.
                </p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">Entreprise</div>
                    <div className="opacity-80">Grade | Année(s) d'xp</div>
                  </div>
                  <div>
                    <div className="font-semibold">Rôle</div>
                    <div className="opacity-80">Cursus</div>
                  </div>
                  <div>
                    <div className="font-semibold">École</div>
                    <div className="opacity-80">Cursus</div>
                  </div>
                  <div>
                    <div className="font-semibold">💰 Total Annuel (Brut)</div>
                    <div className="opacity-80">Fixe | Bonus | Stock</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-zinc-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
                    💼
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      +2.5 millions
                    </h3>
                    <p className="text-sm text-zinc-600">vues par mois</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">+50 000</h4>
                    <p className="text-sm text-zinc-600">abonnés au total</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">+15 000</h4>
                    <p className="text-sm text-zinc-600">membres newsletter</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Discord Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-zinc-600/20 text-zinc-300 border-zinc-400/30 mb-6">
              🎯 Le Bridge you Club
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 px-4">
              Notre Discord
              <br />
              <span className="bg-gradient-to-r from-zinc-300 to-zinc-100 bg-clip-text text-transparent">
                Finance, Conseil et Tech
              </span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  Knowledge is power
                </h3>
                <p className="text-sm text-zinc-300 mb-6">
                  Ceux qui réussissent sont ceux qui ont les bonnes informations
                  et les bons contacts. Notre Discord permet aux étudiants
                  d'échanger, de networker et d'avoir le bon filon avant les
                  autres.
                </p>
                <Button className="bg-zinc-600 hover:bg-zinc-700 text-white text-sm">
                  Accéder au Discord →
                </Button>
                <div className="flex items-center mt-6">
                  <div className="flex -space-x-2 mr-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-500 to-zinc-400 border-2 border-white"
                      ></div>
                    ))}
                  </div>
                  <span className="text-white font-semibold text-sm">
                    +1000 étudiants inscrits
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-6">
                  Notre offre:
                </h3>
                {[
                  "✅ Canaux d'échange par domaine",
                  "✅ Alertes d'offres de Stages et Summers",
                  "✅ Templates CVs, Questions d'entretiens, etc.",
                  "✅ Masterclass bi-mensuelle par un professionnel",
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center text-white text-base"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-zinc-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-zinc-100 text-zinc-700 mb-6">
              🏢 Une offre pour les entreprises
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 px-4">
              Boostez votre
              <br />
              <span className="bg-gradient-to-r from-zinc-600 to-zinc-400 bg-clip-text text-transparent">
                marque employeur
              </span>
            </h2>
            <Button size="lg" className="bg-zinc-600 hover:bg-zinc-700 mb-16">
              Nous contacter
            </Button>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {[
              {
                title: "Campagnes Média",
                description:
                  "Présentez votre entreprise à travers nos réseaux sociaux.",
                icon: "📱",
              },
              {
                title: "Publication d'offres",
                description: "Publiez un nombre illimité d'offres d'emploi.",
                icon: "📝",
              },
              {
                title: "Recrutement ciblé",
                description:
                  "Communiquez vos offres à travers +70 associations étudiantes.",
                icon: "🎯",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-zinc-600">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8 items-center opacity-60 px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.6 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            {/* Real Bank Logos */}
            {banks.slice(0, 5).map((bank, index) => (
              <motion.div
                key={bank.id}
                className="bg-white/80 backdrop-blur h-16 rounded-lg flex items-center justify-center p-4 border border-zinc-200/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <img
                  src={bank.logo_url}
                  alt={bank.name}
                  className="max-h-8 w-auto object-contain"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Image
              src="/logo.png"
              alt="Bridge you"
              width={120}
              height={40}
              className="mx-auto mb-6"
            />
            <p className="text-base text-zinc-300 max-w-2xl mx-auto">
              Trouve les opportunités les plus prestigieuses grâce à BridgeYou,
              la plateforme #1 pour lancer ta carrière!
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 px-4">
            <div>
              <h4 className="text-sm font-semibold mb-4">Produits</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Trouve ton CV
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Les Salaires
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Tracker BridgeYou
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Communauté</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Discord
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    LinkedIn
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Aide
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Conditions d'utilisation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-8 text-center text-zinc-400">
            <p className="text-sm">
              &copy; 2024 BridgeYou. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
