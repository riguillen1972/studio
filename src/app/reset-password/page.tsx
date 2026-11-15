'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { PageTransition } from '@/components/page-transition';

const MIN_LENGTH = 8;

/**
 * Set a new password. Reached from the reset email (the link signs you in through
 * /auth/callback first) or from Change Password on the Profile page.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`Your password needs at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords don't match.");

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      <ThemeToggle />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">New Password</h1>
          <p className="text-muted-foreground mt-1">Choose a new password for your account</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-headline">
              {done ? 'Your password was changed' : signedIn === false ? 'This link has expired' : 'Set a new password'}
            </CardTitle>
            <CardDescription>
              {done
                ? 'Taking you to your dashboard…'
                : signedIn === false
                  ? 'Reset links only work once and for a short time. Ask for a new one.'
                  : `At least ${MIN_LENGTH} characters.`}
            </CardDescription>
          </CardHeader>

          {done ? (
            <CardContent className="flex justify-center p-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </CardContent>
          ) : signedIn === null ? (
            <CardContent className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></CardContent>
          ) : signedIn === false ? (
            <CardFooter>
              <Button asChild className="w-full"><Link href="/forgot-password">Send a new reset link</Link></Button>
            </CardFooter>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" type="password" autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={MIN_LENGTH} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input id="confirm" type="password" autoComplete="new-password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} required minLength={MIN_LENGTH} disabled={isLoading} />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change password'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="text-center">
          <Link href={signedIn ? '/profile' : '/login'} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            {signedIn ? 'Back to profile' : 'Back to login'}
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
