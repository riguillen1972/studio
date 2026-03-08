import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not signed in and trying to access app routes, redirect to login
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard') ||
    !user && request.nextUrl.pathname.startsWith('/tools') ||
    !user && request.nextUrl.pathname.startsWith('/quiz') ||
    !user && request.nextUrl.pathname.startsWith('/flashcards') ||
    !user && request.nextUrl.pathname.startsWith('/homework') ||
    !user && request.nextUrl.pathname.startsWith('/scan') ||
    !user && request.nextUrl.pathname.startsWith('/summarizer') ||
    !user && request.nextUrl.pathname.startsWith('/progress') ||
    !user && request.nextUrl.pathname.startsWith('/library') ||
    !user && request.nextUrl.pathname.startsWith('/profile') ||
    !user && request.nextUrl.pathname.startsWith('/bible-verse') ||
    !user && request.nextUrl.pathname.startsWith('/mini-app-generator') ||
    !user && request.nextUrl.pathname.startsWith('/video-generator')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
