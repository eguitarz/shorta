import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const locales = ['en', 'es', 'ko', 'zh-TW'] as const;
const defaultLocale = 'en';

function getPreferredLocale(request: NextRequest): string {
  // 1. Check cookie (user preference)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const browserLocales = acceptLanguage.split(',').map(l => l.split(';')[0].trim());
    for (const browserLocale of browserLocales) {
      // Exact match
      const exactMatch = locales.find(l => browserLocale === l || browserLocale.toLowerCase() === l.toLowerCase());
      if (exactMatch) return exactMatch;

      // Prefix match (e.g., 'zh' matches 'zh-TW', 'es-MX' matches 'es')
      const prefixMatch = locales.find(l =>
        browserLocale.startsWith(l.split('-')[0]) || l.startsWith(browserLocale.split('-')[0])
      );
      if (prefixMatch) return prefixMatch;
    }
  }

  // 3. Fallback to default
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  // Force HTTPS redirect (skip for localhost/development)
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = request.headers.get('x-forwarded-proto');

  // Only redirect to HTTPS in production (non-localhost) when explicitly on HTTP
  if (!isLocalhost && proto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Inject pathname for layout to access
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname);

  // Inject locale for i18n
  const locale = getPreferredLocale(request);
  supabaseResponse.headers.set('x-locale', locale);

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

  // Track last visit time (throttled to once per 5 minutes via cookie)
  if (user && !request.cookies.get('_visit_tracked')) {
    supabaseResponse.cookies.set('_visit_tracked', '1', {
      maxAge: 300, // 5 minutes
      httpOnly: true,
      sameSite: 'lax',
    });
    const { error: visitError } = await supabase
      .from('user_profiles')
      .update({ last_visited_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (visitError) {
      console.error('Failed to update last_visited_at:', visitError.message);
    } else {
      console.log('Updated last_visited_at for user:', user.id);
    }
  }

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
