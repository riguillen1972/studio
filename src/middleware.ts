import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json and other public files with an extension (images, audio)
     * - login (login page itself)
     * - api (API routes)
     * - / (root landing page)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|login|auth|api|$|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|txt|xml|mp3|wav|webmanifest)$).*)',
  ],
};
