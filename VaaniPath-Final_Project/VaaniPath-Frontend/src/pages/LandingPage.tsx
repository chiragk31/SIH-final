import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import IntroAnimation from '@/components/ui/scroll-morph-hero';
import {
  GraduationCap,
  Languages,
  Video,
  Users,
  Globe,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Palette,
  Code,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Wrench,
  Cpu,
  Heart
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

// Floating Particle Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 10,
    delay: Math.random() * 5,
    size: 1 + Math.random() * 2
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-400/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Aurora Gradient Blobs
const AuroraBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Blob 1 - Blue */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: ['-20%', '20%', '-20%'],
          y: ['-10%', '10%', '-10%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ top: '10%', left: '10%' }}
      />

      {/* Blob 2 - Purple */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: ['20%', '-20%', '20%'],
          y: ['10%', '-10%', '10%'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ top: '40%', right: '10%' }}
      />

      {/* Blob 3 - Teal */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['20%', '-20%', '20%'],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ bottom: '20%', left: '50%' }}
      />
    </div>
  );
};

// Tech Grid Background
const TechGrid = () => {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-blue-500/30"
            />
          </pattern>
          <linearGradient id="grid-fade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="fade-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fade-mask)" />
      </svg>
    </div>
  );
};

// Noise Texture Overlay
const NoiseTexture = () => {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
};

// Light Rays
const LightRays = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Horizontal light streak */}
      <div
        className="absolute top-1/3 left-0 right-0 h-[300px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(147, 197, 253, 0.08) 50%, transparent 100%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Diagonal accent */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle at top right, rgba(167, 139, 250, 0.1) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
};

const LandingPage = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Stagger animation for cards
  const containerVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Features with vocational focus and color-blind safe colors
  const features = [
    {
      icon: Cpu,
      title: t('landing.features.aiTitle') || 'AI-Powered Localization',
      description: t('landing.features.aiDesc') || 'Automated video dubbing in 22 Indian languages using advanced AI technology',
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'hover:border-blue-400 dark:hover:border-blue-600',
      hoverBg: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/20'
    },
    {
      icon: Wrench,
      title: t('landing.features.vocationalTitle') || 'Vocational Skills Training',
      description: t('landing.features.vocationalDesc') || 'Industry-aligned skill development programs for career advancement',
      color: 'text-purple-700 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'hover:border-purple-400 dark:hover:border-purple-600',
      hoverBg: 'hover:bg-purple-100/50 dark:hover:bg-purple-900/20'
    },
    {
      icon: Globe,
      title: t('landing.features.multilingualTitle') || '22 Indian Languages',
      description: t('landing.features.multilingualDesc') || 'Learn in your mother tongue with comprehensive regional language support',
      color: 'text-teal-700 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'hover:border-teal-400 dark:hover:border-teal-600',
      hoverBg: 'hover:bg-teal-100/50 dark:hover:bg-teal-900/20'
    },
    {
      icon: Heart,
      title: t('landing.features.accessibleTitle') || 'Fully Accessible',
      description: t('landing.features.accessibleDesc') || 'WCAG 2.1 AA compliant platform meeting government accessibility standards',
      color: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderColor: 'hover:border-indigo-400 dark:hover:border-indigo-600',
      hoverBg: 'hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20'
    },
  ];

  const benefits = [
    { text: t('landing.aiTranslation') || 'AI-powered instant translation', icon: Cpu },
    { text: t('landing.selfPaced') || 'Learn at your own pace', icon: Users },
    { text: t('landing.progressTracking') || 'Track your progress', icon: Video },
    { text: t('landing.interactiveLearning') || 'Interactive learning experience', icon: Languages },
    { text: t('landing.mobileFriendly') || 'Mobile-friendly platform', icon: Globe },
    { text: t('landing.freeAccess') || 'Free access to quality education', icon: Heart },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-background text-foreground">
      {/* Background Effects Layer */}
      <div className="fixed inset-0 z-0">
        {!shouldReduceMotion && (
          <>
            <AuroraBackground />
            <FloatingParticles />
            <LightRays />
          </>
        )}
        <TechGrid />
        <NoiseTexture />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <Header />

        {/* Main Content */}
        <main id="main-content">
          {/* Scroll-Morph Hero Section (UNCHANGED) */}
          <section
            className="relative h-[700px] sm:h-[800px]"
            aria-labelledby="hero-heading"
          >
            <IntroAnimation />
          </section>

          {/* Vocational Training Section (UNCHANGED) */}
          {/* ========================= NEW MODERN SECTION ========================= */}
          <section className="relative py-28 overflow-hidden bg-background/60 backdrop-blur-xl">

            {/* Background soft gradients */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl absolute -top-10 right-10"></div>
              <div className="w-[350px] h-[350px] bg-purple-400/10 rounded-full blur-3xl absolute bottom-0 left-10"></div>
            </div>

            {/* SHIFTED LEFT USING lg:ml-20 */}
            <div className="container mx-auto px-6 lg:ml-20 relative z-10 grid lg:grid-cols-2 gap-20 items-center">

              {/* LEFT CONTENT */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                  Learning That<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Adapts to You
                  </span>
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  A personalized, AI-enhanced learning experience built to empower every student—no matter where they come from or what they speak.
                </p>

                <ul className="space-y-5 text-lg">
                  {[
                    "Smart recommendations tailored to your progress",
                    "Minimal, distraction-free learning UI",
                    "High-quality micro-lessons for faster learning",
                    "Built for all devices — mobile, tablet, desktop"
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* RIGHT VISUAL */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative w-full flex justify-center"
              >
                <div className="relative w-[420px] h-[420px]">

                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl"></div>

                  {/* Glass Circle */}
                  <div className="absolute inset-0 rounded-full bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 shadow-2xl"></div>

                  {/* Image OR Illustration */}
                  <img
                    src="/images/ai-learning.png"
                    alt="Adaptive AI Learning"
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                  />

                </div>
              </motion.div>

            </div>
          </section>



          {/* ===== NEW MODERN SECTION 1 – AI Showcase (OpenAI-style minimal) ===== */}
          <section className="relative py-24 lg:py-28 bg-gradient-to-b from-background/70 to-blue-50/30 dark:from-slate-950/80 dark:to-slate-900/40 backdrop-blur-xl">
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <div className="w-[650px] h-[650px] bg-blue-400/20 rounded-full blur-3xl absolute -top-24 -left-24" />
              <div className="w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl absolute bottom-10 right-10" />
            </div>

            <div className="container mx-auto px-4 lg:px-6 relative z-10">
              <motion.h2
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0, y: 40 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.8 }
                })}
                className="text-center text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              >
                Built for the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Next Generation
                </span>
              </motion.h2>

              <motion.p
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.8, delay: 0.2 }
                })}
                className="text-center text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-16"
              >
                A modern learning platform combining AI, accessibility, and beautiful UI — crafted for learners across India, in every language.
              </motion.p>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                {[
                  {
                    title: 'AI Voice Localization',
                    desc: 'Transform instructor videos into 22 languages with natural, emotion-aware AI voices.',
                    icon: Cpu
                  },
                  {
                    title: 'Immersive Learning Flows',
                    desc: 'Clean layouts, calm animations, and zero clutter — so learners stay fully focused.',
                    icon: Globe
                  },
                  {
                    title: 'Career-Ready Skill Paths',
                    desc: 'Vocational tracks aligned with real-world jobs, mapped to India’s evolving industries.',
                    icon: Briefcase
                  }
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    {...(shouldReduceMotion ? {} : {
                      initial: { opacity: 0, y: 40 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.7, delay: i * 0.15 }
                    })}
                    className="group p-7 lg:p-8 rounded-3xl border border-white/50 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_18px_45px_rgba(15,23,42,0.18)] hover:shadow-[0_26px_70px_rgba(15,23,42,0.30)] hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg mb-6">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== NEW MODERN SECTION 2 – Circular Image + Copy ===== */}
          <section className="relative py-24 lg:py-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-transparent to-purple-50/50 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-900/40" />

            <div className="container mx-auto px-4 lg:px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Circular Image area – match the design you showed.
                    Replace /images/vaanipath-circle.png with your actual image path */}
                <motion.div
                  {...(shouldReduceMotion ? {} : {
                    initial: { opacity: 0, scale: 0.9 },
                    whileInView: { opacity: 1, scale: 1 },
                    viewport: { once: true },
                    transition: { duration: 0.9 }
                  })}
                  className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] lg:w-[420px] lg:h-[420px] mx-auto"
                >
                  <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/80 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl" />
                  <img
                    src="/images/vaanipath-circle.png"
                    alt="VaaniPath AI-powered learning visualization"
                    className="absolute inset-[12px] sm:inset-[16px] w-auto h-auto object-cover rounded-full"
                  />
                </motion.div>

                {/* Text column */}
                <motion.div
                  {...(shouldReduceMotion ? {} : {
                    initial: { opacity: 0, x: 40 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 }
                  })}
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                    The future of vocational learning —{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                      powered by AI
                    </span>
                  </h2>

                  <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                    VaaniPath blends real instructors, localized content, and AI-enhanced delivery to create a calm, premium learning experience in every major Indian language.
                  </p>

                  <ul className="space-y-3">
                    {[
                      'Hyper-clear AI voiceovers tuned for regional accents.',
                      'Minimal, modern interface designed to reduce cognitive load.',
                      'Learn on mobile, tablet, or desktop with a consistent experience.',
                      'Accessibility-first — WCAG 2.1 AA aligned from day one.'
                    ].map((txt, index) => (
                      <motion.li
                        key={index}
                        {...(shouldReduceMotion ? {} : {
                          initial: { opacity: 0, x: -15 },
                          whileInView: { opacity: 1, x: 0 },
                          viewport: { once: true },
                          transition: { delay: index * 0.08 }
                        })}
                        className="flex items-start gap-3 text-sm md:text-base text-foreground"
                      >
                        <CheckCircle2 className="mt-1 w-5 h-5 text-blue-600" />
                        <span>{txt}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ===== NEW MODERN SECTION 3 – Stats strip ===== */}
          <section className="py-10 border-y border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="grid sm:grid-cols-3 gap-8 text-center">
                {[
                  { label: 'Learners Onboarded', value: '10,000+' },
                  { label: 'Vocational Tracks', value: '40+' },
                  { label: 'Indian Languages', value: '22' }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1 items-center">
                    <span className="text-2xl md:text-3xl font-semibold text-foreground">
                      {item.value}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== NEW MODERN SECTION 4 – Glass CTA ===== */}
          <section className="py-24 lg:py-28 relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-[480px] h-[480px] bg-blue-500/10 rounded-full blur-3xl absolute -bottom-10 left-10" />
              <div className="w-[420px] h-[420px] bg-purple-500/10 rounded-full blur-3xl absolute -top-10 right-6" />
            </div>

            <div className="container mx-auto px-4 lg:px-6 relative z-10">
              <motion.div
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0, scale: 0.96 },
                  whileInView: { opacity: 1, scale: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.7 }
                })}
                className="max-w-4xl mx-auto rounded-[32px] border border-white/40 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_26px_70px_rgba(15,23,42,0.35)] px-8 md:px-12 py-12 md:py-14 text-center"
              >
                <p className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50/80 dark:bg-slate-800/80 text-xs md:text-sm text-blue-700 dark:text-blue-300 mb-5 border border-blue-100/70 dark:border-slate-700/80">
                  <Heart className="w-4 h-4" />
                  Accessible • Multilingual • AI-enhanced
                </p>

                <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-foreground mb-4 leading-tight">
                  Ready to begin your <span className="text-blue-600">learning journey</span>?
                </h2>

                <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10">
                  Create a free account and explore AI-dubbed courses, vocational programs, and localized learning experiences designed for every learner in India.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 md:h-14 px-8 md:px-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm md:text-base font-semibold hover:opacity-90 shadow-lg"
                  >
                    <Link to="/login">
                      Create Free Account
                      <GraduationCap className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    asChild
                    size="lg"
                    className="h-12 md:h-14 px-7 rounded-full border-border/70 bg-background/70 text-xs md:text-sm"
                  >
                    <Link to="/courses">
                      Preview Courses
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* ===== NEW MINIMAL FUTURISTIC FOOTER ===== */}
        <footer
          className="bg-slate-950 text-slate-200 py-10 border-t border-slate-800"
          role="contentinfo"
          aria-label="Site footer"
        >
          <div className="container px-4 lg:px-6 mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-white">
                  VaaniPath
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  AI-powered multilingual vocational learning for every learner in India.
                </p>
              </div>

              <div className="flex items-center gap-4" aria-label="Social media links">
                {[
                  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
                  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
                  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' }
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-900 hover:bg-blue-600 flex items-center justify-center transition-colors"
                    aria-label={`Follow us on ${label}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] md:text-xs text-slate-500">
              <span>
                © 2025 VaaniPath Education Platform. All rights reserved.
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                WCAG 2.1 AA Compliant
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
