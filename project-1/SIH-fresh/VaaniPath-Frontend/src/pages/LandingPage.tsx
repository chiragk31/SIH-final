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
      transition: { duration: 0.5, ease: "easeOut" }
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

  // Benefits list
  const benefits = [
    { text: t('landing.aiTranslation') || 'AI-powered instant translation', icon: Cpu },
    { text: t('landing.selfPaced') || 'Learn at your own pace', icon: Users },
    { text: t('landing.progressTracking') || 'Track your progress', icon: Video },
    { text: t('landing.interactiveLearning') || 'Interactive learning experience', icon: Languages },
    { text: t('landing.mobileFriendly') || 'Mobile-friendly platform', icon: Globe },
    { text: t('landing.freeAccess') || 'Free access to quality education', icon: Heart },
  ];

  // Course categories with color-blind safe palette
  const categories = [
    {
      title: t('landing.categories.technology') || 'Technology',
      icon: Code,
      count: '50+ courses',
      gradient: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-800 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: t('landing.categories.business') || 'Business',
      icon: Briefcase,
      count: '40+ courses',
      gradient: 'from-purple-600 to-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      textColor: 'text-purple-800 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: t('landing.categories.design') || 'Design & Creative',
      icon: Palette,
      count: '35+ courses',
      gradient: 'from-teal-600 to-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/20',
      textColor: 'text-teal-800 dark:text-teal-300',
      borderColor: 'border-teal-200 dark:border-teal-800'
    },
    {
      title: t('landing.categories.language') || 'Languages',
      icon: Languages,
      count: '22 languages',
      gradient: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      textColor: 'text-indigo-800 dark:text-indigo-300',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
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
          {/* Scroll-Morph Hero Section */}
          <section
            className="relative h-[700px] sm:h-[800px]"
            aria-labelledby="hero-heading"
          >
            <IntroAnimation />
          </section>

          {/* Animated Vocational Courses Section */}
          <section
            className="py-20 lg:py-28 relative bg-background/80 backdrop-blur-sm"
            aria-labelledby="features-heading"
          >
            <div className="container px-4 mx-auto">
              <motion.div
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.6 }
                })}
                className="text-center mb-16"
              >
                <h2
                  id="features-heading"
                  className="text-3xl lg:text-5xl font-bold mb-4 text-foreground"
                >
                  Vocational Training{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Platform
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Industry-aligned skill development in your preferred language
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                role="list"
              >
                {features.map((feature, index) => (
                  <motion.article
                    key={index}
                    variants={itemVariants}
                    className="group"
                    role="listitem"
                  >
                    <Card
                      className={`h-full p-6 lg:p-8 border-2 ${feature.borderColor} ${feature.hoverBg} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 focus-within:ring-4 focus-within:ring-primary/20 focus-within:outline-none bg-card/80 backdrop-blur-sm`}
                      tabIndex={0}
                      role="article"
                      aria-labelledby={`feature-${index}-title`}
                    >
                      <div className={`mb-6 inline-flex rounded-2xl ${feature.bg} p-4 transition-transform duration-300 group-hover:scale-110`} aria-hidden="true">
                        <feature.icon className={`h-10 w-10 ${feature.color}`} strokeWidth={2} />
                      </div>
                      <h3
                        id={`feature-${index}-title`}
                        className="mb-3 text-xl lg:text-2xl font-bold text-foreground"
                      >
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </Card>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section
            className="py-20 lg:py-28 bg-gradient-to-b from-background/50 to-secondary/20 backdrop-blur-sm relative"
            aria-labelledby="benefits-heading"
          >
            <div className="container px-4 mx-auto">
              <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
                <motion.div
                  {...(shouldReduceMotion ? {} : {
                    initial: { opacity: 0, x: -30 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.6 }
                  })}
                >
                  <h2
                    id="benefits-heading"
                    className="text-3xl lg:text-5xl font-bold mb-6 leading-tight text-foreground"
                  >
                    Education Without{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                      Boundaries
                    </span>
                  </h2>
                  <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                    Breaking language barriers to make quality vocational education accessible to everyone
                  </p>
                  <ul className="space-y-4 lg:space-y-5" role="list" aria-label="Platform benefits">
                    {benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        {...(shouldReduceMotion ? {} : {
                          initial: { opacity: 0, x: -20 },
                          whileInView: { opacity: 1, x: 0 },
                          viewport: { once: true },
                          transition: { delay: index * 0.1 }
                        })}
                        className="flex items-center space-x-4 group"
                      >
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md"
                          aria-hidden="true"
                        >
                          <benefit.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-base lg:text-lg font-medium text-foreground leading-relaxed">
                          {benefit.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Static illustration with alt text */}
                <motion.div
                  {...(shouldReduceMotion ? {} : {
                    initial: { opacity: 0, scale: 0.95 },
                    whileInView: { opacity: 1, scale: 1 },
                    viewport: { once: true },
                    transition: { duration: 0.8 }
                  })}
                  className="relative"
                >
                  <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 p-1 shadow-2xl">
                    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-[1.4rem] flex items-center justify-center p-12">
                      <div className="text-center">
                        <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-8 shadow-inner">
                          <Globe className="w-20 h-20 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-foreground">
                          Global Standards
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          Local Languages
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Course Categories Grid */}
          <section
            className="py-20 lg:py-28 bg-background/80 backdrop-blur-sm relative"
            aria-labelledby="categories-heading"
          >
            <div className="container px-4 mx-auto">
              <motion.div
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true }
                })}
                className="text-center mb-16"
              >
                <h2
                  id="categories-heading"
                  className="text-3xl lg:text-5xl font-bold mb-4 text-foreground"
                >
                  Explore{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                    Course Categories
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Choose from a wide range of vocational and skill-based programs
                </p>
              </motion.div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
                {categories.map((category, index) => (
                  <motion.div
                    key={index}
                    {...(shouldReduceMotion ? {} : {
                      initial: { opacity: 0, y: 20 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { delay: index * 0.1 },
                      whileHover: { scale: 1.05 }
                    })}
                    role="listitem"
                  >
                    <Link
                      to="/courses"
                      className="block group"
                      aria-label={`View ${category.title} courses`}
                    >
                      <Card className={`h-full p-8 ${category.bgColor} border-2 ${category.borderColor} hover:shadow-2xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none backdrop-blur-sm`}>
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-6 shadow-lg transition-transform duration-300 group-hover:rotate-6`}
                          aria-hidden="true"
                        >
                          <category.icon className="w-10 h-10 text-white" strokeWidth={2} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${category.textColor}`}>
                          {category.title}
                        </h3>
                        <p className="text-muted-foreground font-semibold">
                          {category.count}
                        </p>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-xl focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Link to="/courses">
                    View All Courses
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section
            className="py-20 lg:py-28 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white relative overflow-hidden"
            aria-labelledby="cta-heading"
          >
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
            <div className="container px-4 mx-auto relative z-10 text-center">
              <motion.div
                {...(shouldReduceMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true }
                })}
              >
                <h2
                  id="cta-heading"
                  className="text-3xl lg:text-5xl font-bold mb-6"
                >
                  Ready to Start Your Learning Journey?
                </h2>
                <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
                  Join thousands of students learning vocational skills in their local language
                </p>
                <Button
                  asChild
                  size="lg"
                  className="h-16 px-12 text-xl rounded-full bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-900 shadow-2xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:outline-none font-bold"
                  aria-label="Create your account now"
                >
                  <Link to="/login">
                    Create Free Account
                    <GraduationCap className="ml-3 h-6 w-6" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>
        </main>

        {/* Professional Dark Footer */}
        <footer
          className="bg-slate-900 text-slate-100 py-16 border-t-4 border-blue-600 relative"
          role="contentinfo"
          aria-label="Site footer"
        >
          <div className="container px-4 mx-auto">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {/* About */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  About VaaniPath
                </h3>
                <p className="text-slate-300 mb-4 leading-relaxed text-sm">
                  Empowering vocational education through multilingual accessibility and AI-powered localization technology.
                </p>
                <div className="flex items-center space-x-2 text-slate-300 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Serving All of India</span>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Quick Links
                </h3>
                <nav aria-label="Footer navigation">
                  <ul className="space-y-3">
                    {['Courses', 'About Us', 'Contact', 'Blog'].map((item) => (
                      <li key={item}>
                        <Link
                          to={`/${item.toLowerCase().replace(' ', '')}`}
                          className="text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none rounded px-1 text-sm"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Legal
                </h3>
                <nav aria-label="Legal navigation">
                  <ul className="space-y-3">
                    {['Privacy Policy', 'Terms of Service', 'Accessibility', 'WCAG Compliance'].map((item) => (
                      <li key={item}>
                        <Link
                          to={`/${item.toLowerCase().replace(/ /g, '-')}`}
                          className="text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none rounded px-1 text-sm"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Contact & Social */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Connect With Us
                </h3>
                <div className="flex space-x-3 mb-6" role="list" aria-label="Social media links">
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
                      className="w-11 h-11 rounded-full bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
                      aria-label={`Follow us on ${label}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-slate-300 text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <a
                      href="mailto:support@vaanipath.edu"
                      className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none rounded px-1"
                    >
                      support@vaanipath.edu
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <a
                      href="tel:+911234567890"
                      className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none rounded px-1"
                    >
                      +91 123 456 7890
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-sm">
                © 2025 VaaniPath Education Platform. All rights reserved.
                <span className="mx-3">•</span>
                <span className="text-blue-400 font-medium">WCAG 2.1 AA Compliant</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
