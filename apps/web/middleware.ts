import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Force HTTPS redirect (skip in development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (!isDevelopment && proto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Inject pathname for layout to access
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname);

  // Allow anonymous access to /try page (trial form)
  const isTryPage = request.nextUrl.pathname.startsWith('/try');
  // Also allow /analyzer/* with ?trial=true query param (for viewing trial results)
  const isTrialAnalyzer = request.nextUrl.pathname.startsWith('/analyzer/') &&
                          request.nextUrl.searchParams.get('trial') === 'true';

  if (isTryPage || isTrialAnalyzer) {
    // Public trial routes don't require authentication
    supabaseResponse.headers.set('x-allow-anonymous', 'true');
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /home route - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/home') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to /home if already authenticated and trying to access /login
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
