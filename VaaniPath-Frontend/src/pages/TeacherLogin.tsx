import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, ArrowLeft, Loader2, Lock, Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useWalkthrough } from '@/hooks/useWalkthrough';

const TeacherLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { startTeacherLoginTour } = useWalkthrough();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await login({ email, password });

      // Get user data to validate teacher status
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // REJECT if not a teacher
      if (!userData.is_teacher) {
        toast({
          title: 'Access Denied',
          description: `This portal is exclusively for educators.`,
          variant: 'destructive',
        });
        // Logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggingIn(false);
        return;
      }

      // Teacher login successful
      toast({
        title: 'Welcome, Educator!',
        description: 'Accessing your teaching dashboard...',
      });
      navigate('/teacher/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans bg-background text-foreground transition-colors duration-300">
      <PremiumBackground />
      <Header />

      <div className="container px-4 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-md"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center rounded-2xl bg-secondary/20 backdrop-blur-md border border-secondary/30 p-5 mb-6 shadow-xl"
            >
              <BookOpen className="h-10 w-10 text-secondary-foreground" />
            </motion.div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <h1 className="text-4xl font-bold text-foreground font-heading tracking-tight">{t('auth.teacherPortal')}</h1>
              <Button variant="ghost" size="icon" onClick={startTeacherLoginTour} className="rounded-full hover:bg-secondary/10" title="Start Tour">
                <HelpCircle className="h-6 w-6 text-secondary" />
              </Button>
            </div>
            <p className="text-lg text-muted-foreground">{t('auth.teacherSubtitle')}</p>
          </div>

          <Card id="teacher-login-card" className="glass-card border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative group">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-50" />

            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t('auth.educatorLogin')}</h2>
                <p className="text-sm text-muted-foreground">{t('auth.enterCredentials')}</p>
              </div>

              <div className="space-y-5">
                <div id="teacher-email-section" className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email" className="text-foreground/80">{t('auth.emailAddress')}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Please enter your registered educator email. Ensure it is a valid Gmail address.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="educator@vaanipath.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50 border-input focus:ring-secondary pl-4 h-11 transition-all duration-200 hover:border-secondary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="password" className="text-foreground/80">{t('auth.password')}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter your secure password. Make sure it is correct.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <a href="#" className="text-xs text-secondary-foreground hover:underline">{t('auth.forgotPassword')}</a>
                  </div>
                  <div id="teacher-password-section" className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background/50 border-input focus:ring-secondary pl-4 h-11 transition-all duration-200 hover:border-secondary/50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  id="teacher-login-btn"
                  type="submit"
                  className="w-full h-12 text-base font-medium shadow-lg hover:shadow-secondary/25 transition-all duration-300 bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:-translate-y-0.5"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.verifying')}
                    </>
                  ) : (
                    <>
                      {t('auth.loginToDashboard')}
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-center text-muted-foreground bg-secondary/5 p-4 rounded-lg border border-secondary/10 mt-6">
                <div className="flex items-center justify-center gap-2 mb-1 text-secondary-foreground">
                  <Lock className="h-3 w-3" />
                  <span className="font-semibold">{t('auth.secureAccess')}</span>
                </div>
                {t('auth.teacherAccessNote')}
              </div>
            </form>
          </Card>

          <div className="mt-8 text-center">
            <Link to="/landingpage" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {t('auth.backToHome')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherLogin;
