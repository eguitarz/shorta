import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { locales, isValidLocale, type Locale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

// GET - Return user's language preference
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Check cookie first (works for both anonymous and logged-in users)
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return NextResponse.json({ locale: cookieLocale });
  }

  // For logged-in users, check database preference
  const user = await getAuthenticatedUser(request);
  if (user) {
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
              // API route - ignore cookie setting errors
            }
          },
        },
      }
    );

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('user_id', user.id)
      .single();

    if (profile?.preferred_language && isValidLocale(profile.preferred_language)) {
      return NextResponse.json({ locale: profile.preferred_language });
    }
  }

  // Default to English
  return NextResponse.json({ locale: 'en' });
}

// POST - Update language preference
export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    // Validate locale
    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale. Supported: en, es, ko, zh-TW' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Always set the cookie (works for anonymous users too)
    const response = NextResponse.json({ success: true, locale });
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // For logged-in users, also save to database
    const user = await getAuthenticatedUser(request);
    if (user) {
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
                // API route - ignore cookie setting errors
              }
            },
          },
        }
      );

      // Update user profile with language preference
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferred_language: locale })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update language preference in database:', error);
        // Don't fail the request - cookie was set successfully
      }
    }

    return response;
  } catch (error) {
    console.error('Language preference update error:', error);
    return NextResponse.json(
      { error: 'Failed to update language preference' },
      { status: 500 }
    );
  }
}
