'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Loader2, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
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
        router.push('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        setError(error);
      } else {
        setSuccessMessage('Account created! Check your email to confirm, then log in.');
        setIsLogin(true);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      <ThemeToggle />
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Study Buddy AI</h1>
          <p className="text-muted-foreground mt-1">Your personal AI-powered learning assistant</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-headline">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Sign in to continue your learning journey'
                : 'Get started with your free account'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
              )}
              {successMessage && (
                <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">{successMessage}</p>
              )}
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
          Powered by Claude AI & Gemini
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <a href="/terms" className="hover:underline">Terms of Service</a>
          {' · '}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
