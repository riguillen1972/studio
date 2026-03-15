import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * This route handles the email confirmation callback from Supabase.
 * When a user clicks the confirmation link in their email,
 * Supabase redirects them here with a `code` query parameter.
 * We exchange that code for a session, then redirect to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's no code or the exchange failed, redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=Could not verify email. Please try again.`);
}
