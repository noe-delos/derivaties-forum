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
import { DotPattern } from "@/components/magicui/dot-pattern";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedList } from "@/components/magicui/animated-list";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Static banks data
  const banks = [
    {
      id: 1,
      name: "Goldman Sachs",
      logo_url: "/goldman.png",
    },
    {
      id: 2,
      name: "Société Générale",
      logo_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6L1Ve75Tf6cTzo_-ZA8hRYvaX7mwCjd7OOQ&s",
    },
    {
      id: 3,
      name: "Rothschild",
      logo_url: "/rothshild.png",
    },
    {
      id: 4,
      name: "BNP Paribas",
      logo_url:
        "https://companieslogo.com/img/orig/BNP.PA-75daacb0.png?t=1720244491",
    },
    {
      id: 5,
      name: "JPMorgan",
      logo_url: "/jpmorgan.png",
    },
  ];

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
        <DotPattern className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/40 to-zinc-800/40"></div>
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <Badge className="bg-zinc-600/20 text-zinc-300 border-zinc-400/30 mb-8 rounded-full py-2 px-2 pr-4 flex items-center justify-center w-fit mx-auto backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden">
                    <img
                      src="https://derivativesfinance.fr/wp-content/uploads/2024/03/1708998508964-jpeg.webp"
                      alt="Ziyad El Yaagoubi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>Proposé par Ziyad El Yaagoubi</span>
                </div>
              </Badge>
            </motion.div>

            <motion.h1
              className="text-[5.5rem] font-medium text-white mb-6 tracking-tight leading-none"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              La plateforme{" "}
              <span className="bg-gradient-to-b from-white to-amber-400 bg-clip-text text-transparent">
                #1
              </span>
              <br />
              <span className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                pour percer en Finance.
              </span>
            </motion.h1>

            <motion.p
              className="text-md text-zinc-400 mb-8 max-w-4xl mx-auto px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Accède aux opportunités les plus lucratives en Finance, Conseil et
              Tech.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Découvre les salaires réels pour Stages, Alternances, CDI et bien
              plus encore.
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
              <div className="flex -space-x-5">
                {banks.slice(0, 5).map((bank, index) => (
                  <div
                    key={bank.id}
                    className="w-12 h-12 rounded-full border-2 border-white overflow-hidden"
                    style={{ backgroundColor: "#323234" }}
                  >
                    <img
                      src={bank.logo_url}
                      alt={bank.name}
                      className="w-full h-full object-contain p-2 rounded-full"
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

          {/* Bento Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <BentoGrid>
              {/* Salaries Card */}
              <BentoCard
                name="Salaires Transparents"
                description="Découvre les salaires réels des plus grandes entreprises de Finance."
                Icon={({ className }: { className?: string }) => (
                  <Icon
                    icon="material-symbols:payments"
                    className={className}
                  />
                )}
                href="/forum/salaires"
                cta="Voir les salaires"
                className="col-span-3 lg:col-span-2"
                background={
                  <Marquee
                    pauseOnHover
                    className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]"
                  >
                    {[
                      {
                        company: "Goldman Sachs",
                        role: "Analyst M&A",
                        salary: "95k€",
                      },
                      {
                        company: "McKinsey",
                        role: "Consultant",
                        salary: "85k€",
                      },
                      {
                        company: "JPMorgan",
                        role: "Sales & Trading",
                        salary: "88k€",
                      },
                      { company: "BCG", role: "Associate", salary: "90k€" },
                      {
                        company: "Rothschild",
                        role: "Investment Banking",
                        salary: "82k€",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "relative w-48 cursor-pointer overflow-hidden rounded-xl border p-4 m-2",
                          "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                          "transform-gpu transition-all duration-300 ease-out hover:scale-105"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Icon
                              icon="material-symbols:business"
                              className="w-4 h-4 text-white"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {item.company}
                            </p>
                            <p className="text-xs text-gray-600">{item.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            {item.salary}
                          </span>
                        </div>
                      </div>
                    ))}
                  </Marquee>
                }
              />

              {/* Notifications Card */}
              <BentoCard
                name="Alertes Opportunités"
                description="Reste informé des nouvelles offres et opportunités en temps réel."
                Icon={({ className }: { className?: string }) => (
                  <Icon
                    icon="material-symbols:notifications"
                    className={className}
                  />
                )}
                href="/forum/notifications"
                cta="Voir les alertes"
                className="col-span-3 lg:col-span-1"
                background={
                  <AnimatedList className="absolute right-2 top-4 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90" />
                }
              />

              {/* Interviews Card */}
              <BentoCard
                name="Retours d'Expérience"
                description="Accède aux témoignages exclusifs d'entretiens dans les top entreprises."
                Icon={({ className }: { className?: string }) => (
                  <Icon icon="material-symbols:chat" className={className} />
                )}
                href="/forum/interviews"
                cta="Lire les témoignages"
                className="col-span-3 lg:col-span-1"
                background={
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                    <div className="absolute top-6 left-6 space-y-3">
                      {[
                        {
                          company: "Goldman Sachs",
                          type: "Final Round",
                          rating: "4.2/5",
                        },
                        {
                          company: "McKinsey",
                          type: "Case Study",
                          rating: "4.5/5",
                        },
                        {
                          company: "Google",
                          type: "Technical",
                          rating: "4.1/5",
                        },
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.2 }}
                          className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.company}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.type}
                              </p>
                            </div>
                            <div className="text-yellow-500 text-sm font-medium">
                              ⭐ {item.rating}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                }
              />

              {/* Networking Card */}
              <BentoCard
                name="Réseau Professionnel"
                description="Connecte-toi avec +15,000 professionnels de la Finance et du Conseil."
                Icon={({ className }: { className?: string }) => (
                  <Icon icon="material-symbols:group" className={className} />
                )}
                href="/forum/networking"
                cta="Rejoindre le réseau"
                className="col-span-3 lg:col-span-2"
                background={
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                    <div className="absolute top-6 right-6 grid grid-cols-4 gap-2">
                      {banks.map((bank, idx) => (
                        <motion.div
                          key={bank.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="w-12 h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden"
                        >
                          <img
                            src={bank.logo_url}
                            alt={bank.name}
                            className="w-8 h-8 object-contain"
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                        <p className="text-2xl font-bold text-gray-900">
                          15,000+
                        </p>
                        <p className="text-sm text-gray-600">
                          Professionnels connectés
                        </p>
                      </div>
                    </div>
                  </div>
                }
              />
            </BentoGrid>
          </motion.div>

          <motion.div
            className="text-center mt-16"
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
                className="backdrop-blur h-20 w-20 rounded-full flex items-center justify-center p-4 border border-zinc-200/50"
                style={{ backgroundColor: "#323234" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <img
                  src={bank.logo_url}
                  alt={bank.name}
                  className="max-h-10 w-auto object-contain rounded-full"
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
