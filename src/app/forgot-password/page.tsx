'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, GraduationCap, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      <ThemeToggle />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground mt-1">We&apos;ll send you a link to reset your password</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-headline">
              {emailSent ? 'Check your email' : 'Forgot your password?'}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? `We sent a reset link to ${email}`
                : 'Enter your email address and we\'ll send you a reset link'}
            </CardDescription>
          </CardHeader>
          {emailSent ? (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6">
                <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-4">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Didn&apos;t get the email? Check your spam folder or{' '}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setEmailSent(false)}
                >
                  try again
                </button>
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
