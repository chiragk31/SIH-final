import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, ArrowLeft, Loader2, Info, Eye, EyeOff, UserPlus, LogIn, Camera, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { INDIAN_LANGUAGES } from '@/constants/languages';
import { useWalkthrough } from '@/hooks/useWalkthrough';

const StudentLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, signup } = useAuth();
  const { startStudentLoginTour } = useWalkthrough();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: '',
    region: '',
    state: '',
    city: '',
    profileImage: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await login({ email: loginEmail, password: loginPassword });

      // Get user data from localStorage to determine redirect
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // REJECT admins and teachers from student login
      if (userData.is_admin) {
        toast({
          title: 'Wrong Login Page',
          description: 'Admins should use /admin to login',
          variant: 'destructive',
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggingIn(false);
        return;
      }

      if (userData.is_teacher) {
        toast({
          title: 'Wrong Login Page',
          description: 'Teachers should use /teacherlogin',
          variant: 'destructive',
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggingIn(false);
        return;
      }

      // Only students reach here
      toast({
        title: 'Login Successful',
        description: 'Welcome back to VAANIपथ!',
      });

      navigate('/homepage');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (!signupData.preferredLanguage) {
      toast({
        title: 'Language Required',
        description: 'Please select your preferred language',
        variant: 'destructive',
      });
      return;
    }

    // if (!hasAgreedToTerms) {
    //   toast({
    //     title: 'Terms Required',
    //     description: 'Please agree to the terms and conditions',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    setIsSigningUp(true);

    try {
      await signup({
        email: signupData.email,
        password: signupData.password,
        full_name: signupData.name,
        preferred_language: signupData.preferredLanguage,
        is_admin: false,
        profile_image: signupData.profileImage
      });

      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully!',
      });

      navigate('/homepage');
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.response?.data?.detail || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignupData({ ...signupData, profileImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen relative font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      {/* Aurora Background Effects - Matching Landing Page */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[80px] animate-pulse delay-1000" />
      </div>

      <PremiumBackground />
      <Header />

      <div className="relative container px-4 py-24 lg:py-32 flex justify-center items-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[520px]"
        >
          {/* Logo/Icon Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: 10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-1 shadow-2xl mb-6 ring-4 ring-white/30 dark:ring-slate-800/50"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 font-heading tracking-tight">
                {t('auth.studentPortal')}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={startStudentLoginTour}
                className="rounded-full hover:bg-blue-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400"
                title="Start Tour"
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">{t('auth.studentSubtitle')}</p>
          </div>

          <Card id="student-login-card" className="border-0 shadow-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden rounded-3xl ring-1 ring-white/50 dark:ring-slate-700/50">
            {/* Top Gradient Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />

            <Tabs defaultValue="login" className="w-full">
              <div className="px-8 pt-8 pb-4">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl h-14 ring-1 ring-inset ring-slate-200/50 dark:ring-slate-700/50">
                  <TabsTrigger
                    value="login"
                    className="rounded-xl h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-bold transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      {t('common.login')}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-xl h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 font-bold transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      {t('common.signup')}
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8 pt-2">
                <TabsContent value="login" className="mt-0 space-y-6 focus-visible:outline-none">
                  <div className="space-y-1.5 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('auth.welcomeBack')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.readyToLearn')}</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-4">
                      <div id="student-email-section" className="space-y-2">
                        <Label htmlFor="login-email" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">{t('auth.studentEmail')}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="student@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      <div id="student-password-section" className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <Label htmlFor="login-password" className="text-slate-600 dark:text-slate-300 font-medium">{t('auth.password')}</Label>
                          <Link to="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">{t('auth.forgotPassword')}</Link>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      id="student-login-btn"
                      type="submit"
                      className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('auth.loggingIn')}
                        </>
                      ) : t('auth.startLearning')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0 space-y-6 focus-visible:outline-none">
                  <div className="space-y-1.5 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('auth.joinVaaniPath')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.createAccountDesc')}</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                      <label htmlFor="image-upload" className="cursor-pointer group relative">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/30 overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-300 group-hover:scale-105 ${!previewUrl ? 'p-6' : ''}`}>
                          {previewUrl ? (
                            <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full text-slate-400 dark:text-slate-600" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium pb-2">Add Profile Photo</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="signup-name"
                        placeholder="e.g. Rahul Kumar"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="student@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">Password <span className="text-red-500">*</span></Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">Confirm <span className="text-red-500">*</span></Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          required
                          className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">{t('auth.preferredLanguage')} <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(value) => setSignupData({ ...signupData, preferredLanguage: value })}>
                        <SelectTrigger id="language" className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                          {INDIAN_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name} - {lang.native}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">State <span className="text-red-500">*</span></Label>
                        <Input
                          id="state"
                          placeholder="State"
                          value={signupData.state}
                          onChange={(e) => setSignupData({ ...signupData, state: e.target.value })}
                          required
                          className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">City <span className="text-red-500">*</span></Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={signupData.city}
                          onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                          required
                          className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region" className="ml-1 text-slate-600 dark:text-slate-300 font-medium">Region <span className="text-red-500">*</span></Label>
                      <Input
                        id="region"
                        placeholder="Region"
                        value={signupData.region}
                        onChange={(e) => setSignupData({ ...signupData, region: e.target.value })}
                        required
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 mt-2 rounded-xl text-base font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('auth.creatingAccount')}
                        </>
                      ) : t('auth.createFreeAccount')}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          <div className="mt-10 text-center">
            <Link to="/landingpage" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/40 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group ring-1 ring-white/40 dark:ring-slate-700/40 shadow-sm backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {t('auth.backToHome')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;
