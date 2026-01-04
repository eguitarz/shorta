import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Allowed redirect paths after authentication
const ALLOWED_REDIRECT_PATHS = ['/home', '/dashboard'];

// Validate redirect URL to prevent open redirect
function validateRedirectUrl(origin: string, redirectPath?: string): string {
  if (!redirectPath) {
    return `${origin}/home`;
  }

  // Only allow paths, not full URLs
  if (redirectPath.startsWith('http://') || redirectPath.startsWith('https://')) {
    console.warn('Rejected full URL redirect:', redirectPath);
    return `${origin}/home`;
  }

  // Ensure path starts with /
  const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;

  // Check against allowlist
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (allowed) => normalizedPath === allowed || normalizedPath.startsWith(`${allowed}/`)
  );

  if (!isAllowed) {
    console.warn('Rejected non-allowlisted redirect:', normalizedPath);
    return `${origin}/home`;
  }

  return `${origin}${normalizedPath}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const origin = requestUrl.origin;

  // Get redirect path from state parameter (if any)
  // State format: "redirect:/path" or just random string
  let redirectPath: string | undefined;
  if (state && state.startsWith('redirect:')) {
    redirectPath = state.substring('redirect:'.length);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component - ignore
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication, redirect to validated URL
      const redirectUrl = validateRedirectUrl(origin, redirectPath);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('OAuth callback error:', error.message);
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
