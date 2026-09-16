'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Loader2, GraduationCap, ArrowLeft, User, Users, BookOpen, ChevronRight, Shield, Briefcase, School } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PageTransition } from '@/components/page-transition';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'teacher' | 'college' | 'k12';

interface RoleCardData {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentIcon: React.ElementType;
  gradient: string;
  accentColor: string;
  description: string;
}

const roleCards: RoleCardData[] = [
  {
    role: 'teacher',
    title: 'Teacher',
    subtitle: 'Manage & Monitor',
    icon: User,
    accentIcon: Shield,
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    accentColor: 'text-blue-600 dark:text-blue-400',
    description: 'Set class codes, monitor student progress, and customize AI limits',
  },
  {
    role: 'college',
    title: 'College Student',
    subtitle: 'Career-Optimized',
    icon: GraduationCap,
    accentIcon: Briefcase,
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'AI optimized for your career path and field of study',
  },
  {
    role: 'k12',
    title: 'Elementary to High School',
    subtitle: 'Study Buddy AI',
    icon: Users,
    accentIcon: School,
    gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    accentColor: 'text-orange-600 dark:text-orange-400',
    description: 'Your personal AI-powered study companion',
  },
];

const gradeOptions = [
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade (Freshman)' },
  { value: '10', label: '10th Grade (Sophomore)' },
  { value: '11', label: '11th Grade (Junior)' },
  { value: '12', label: '12th Grade (Senior)' },
];

const careerFields = [
  'Computer Science',
  'Engineering',
  'Medicine / Pre-Med',
  'Business / Finance',
  'Law / Pre-Law',
  'Education',
  'Arts & Design',
  'Psychology',
  'Biology / Life Sciences',
  'Mathematics',
  'Nursing',
  'Communications / Media',
  'Political Science',
  'Architecture',
  'Other',
];

function LoginContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const initialPlan = searchParams.get('plan');

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(initialAction !== 'signup');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan);
  
  useEffect(() => {
    if (initialAction === 'signup') setIsLogin(false);
    if (initialPlan) setSelectedPlan(initialPlan);
  }, [initialAction, initialPlan]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [careerField, setCareerField] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        if (selectedPlan && (selectedPlan === 'pro' || selectedPlan === 'max')) {
          try {
            const res = await fetch('/api/stripe/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan: selectedPlan })
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
          } catch (e) {
            console.error('Checkout error:', e);
          }
        }
        router.push('/dashboard');
      }
    } else {
      if (!selectedRole) return;

      const metadata: Record<string, string> = {
        role: selectedRole,
      };
      if (selectedRole === 'k12' && gradeLevel) metadata.grade_level = gradeLevel;
      if (selectedRole === 'college' && careerField) metadata.career_field = careerField;
      if (classCode) metadata.class_code = classCode;

      const { error } = await signUp(email, password, displayName, metadata);
      if (error) {
        setError(error);
      } else {
        setSuccessMessage(`Account created! Check your email to confirm, then log in${selectedPlan ? ' to start your trial' : ''}.`);
        setIsLogin(true);
      }
    }

    setIsLoading(false);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError(null);
    setSuccessMessage(null);
    setIsLogin(true);
  };

  const roleData = selectedRole ? roleCards.find(r => r.role === selectedRole) : null;

  return (
    <PageTransition className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 p-4 relative overflow-hidden">
      <ThemeToggle />

      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tight">Study Buddy AI</h1>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isLogin && !selectedRole ? (
            /* ==================== STEP 1: ROLE SELECTION ==================== */
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
                  Choose Your Role
                </h2>
                <p className="text-muted-foreground mt-2">
                  Select how you&apos;ll be using Study Buddy AI
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roleCards.map((card) => {
                  const Icon = card.icon;
                  const AccentIcon = card.accentIcon;

                  return (
                    <motion.div
                      key={card.role}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Card
                        className="relative cursor-pointer group overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/80 backdrop-blur-sm"
                        onClick={() => setSelectedRole(card.role)}
                      >
                        {/* Gradient accent */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <CardContent className="relative p-8 flex flex-col items-center text-center space-y-5">
                          {/* Icon Circle */}
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors duration-300">
                              <Icon className={`h-11 w-11 ${card.accentColor} transition-transform duration-300 group-hover:scale-110`} />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-card shadow-md border flex items-center justify-center`}>
                              <AccentIcon className={`h-4 w-4 ${card.accentColor}`} />
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <h3 className="text-lg font-bold font-headline">
                              {card.title}
                            </h3>
                            <p className={`text-sm font-medium ${card.accentColor} mt-0.5`}>
                              {card.subtitle}
                            </p>
                          </div>

                          {/* Divider */}
                          <div className="w-12 h-0.5 bg-border rounded-full" />

                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {card.description}
                          </p>

                          {/* CTA */}
                          <div className={`flex items-center gap-1 text-sm font-medium ${card.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                            <span>Get Started</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-8">
                <Bot className="inline h-3 w-3 mr-1" />
                Powered by Google Gemini AI
              </p>
              <p className="text-center text-xs text-muted-foreground mt-1">
                <a href="/terms" className="hover:underline">Terms of Service</a>
                {' · '}
                <a href="/privacy" className="hover:underline">Privacy Policy</a>
              </p>
            </motion.div>
          ) : (
            /* ==================== STEP 2: AUTH FORM ==================== */
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md space-y-6">
                {/* Back button */}
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 -ml-2">
                  <ArrowLeft className="h-4 w-4" />
                  Choose a different role
                </Button>

                {/* Role badge */}
                {roleData && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                    <div className={`w-10 h-10 rounded-lg bg-card shadow-sm border flex items-center justify-center`}>
                      <roleData.icon className={`h-5 w-5 ${roleData.accentColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm font-headline">{roleData.title}</p>
                      <p className={`text-xs ${roleData.accentColor}`}>{roleData.subtitle}</p>
                    </div>
                  </div>
                )}

                <Card className="border-2 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-xl font-headline">
                      {isLogin ? 'Welcome back' : 'Create your account'}
                    </CardTitle>
                    <CardDescription>
                      {isLogin
                        ? 'Sign in to continue your learning journey'
                        : `Set up your ${roleData?.title.toLowerCase()} account`}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                      {/* Display Name (sign-up only) */}
                      {!isLogin && (
                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                      </div>

                      {/* === ROLE-SPECIFIC FIELDS (sign-up only) === */}
                      {!isLogin && selectedRole === 'k12' && (
                        <div className="space-y-2">
                          <Label htmlFor="grade">Grade Level</Label>
                          <Select value={gradeLevel} onValueChange={setGradeLevel}>
                            <SelectTrigger id="grade">
                              <SelectValue placeholder="Select your grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map((g) => (
                                <SelectItem key={g.value} value={g.value}>
                                  {g.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!isLogin && selectedRole === 'college' && (
                        <div className="space-y-2">
                          <Label htmlFor="career">What are you studying for?</Label>
                          <Select value={careerField} onValueChange={setCareerField}>
                            <SelectTrigger id="career">
                              <SelectValue placeholder="Select your field of study" />
                            </SelectTrigger>
                            <SelectContent>
                              {careerFields.map((field) => (
                                <SelectItem key={field} value={field}>
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            The AI will optimize recommendations for your career path
                          </p>
                        </div>
                      )}

                      {!isLogin && (selectedRole === 'k12' || selectedRole === 'college') && (
                        <div className="space-y-2">
                          <Label htmlFor="studentClassCode">Teacher&apos;s Class Password (Optional)</Label>
                          <Input
                            id="studentClassCode"
                            placeholder="Enter the code provided by your teacher"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                            disabled={isLoading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Link your account to your teacher&apos;s class to get personalized AI assistance.
                          </p>
                        </div>
                      )}

                      {!isLogin && selectedRole === 'teacher' && (
                        <div className="space-y-2">
                          <Label htmlFor="classCode">Class Password / Code</Label>
                          <Input
                            id="classCode"
                            placeholder="Create a unique class code (e.g., MATH-2026)"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                            disabled={isLoading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Share this code with your students so they can link to your class. You&apos;ll be able to view their progress, see what they ask the AI, and set usage limits.
                          </p>
                        </div>
                      )}

                      {/* Error / success messages */}
                      {error && (
                        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
                      )}
                      {successMessage && (
                        <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">{successMessage}</p>
                      )}

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                      </div>

                      <Button type="button" variant="outline" className="w-full" onClick={() => signInWithGoogle?.()}>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google
                      </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isLogin ? (
                          'Sign In'
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium"
                          onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                        >
                          {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                      </p>
                      {isLogin && (
                        <a href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary text-center block">
                          Forgot your password?
                        </a>
                      )}
                    </CardFooter>
                  </form>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                  <Bot className="inline h-3 w-3 mr-1" />
                  Powered by Google Gemini AI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
