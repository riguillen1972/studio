import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Handles the links Supabase emails (sign-up confirmation and password reset). The link arrives
 * with a `code`; we exchange it for a session, then go to `next` (the dashboard by default, or
 * /reset-password for a reset link).
 */

/** Only paths on this site: "/x" is fine, but "//evil.com" or "https://…" would leave the site. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/dashboard';
  return next;
}
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the link expired or was already used
  if (next === '/reset-password') return NextResponse.redirect(`${origin}/reset-password`);
  return NextResponse.redirect(`${origin}/login?error=Could not verify email. Please try again.`);
}
