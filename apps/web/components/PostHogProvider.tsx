"use client";

import { useEffect } from "react";
import { initPostHog, identifyUser } from "@/lib/posthog";
import { createClient } from "@/lib/supabase-browser";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();

    // Identify the current user to PostHog when auth state is available
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        identifyUser(user.id, {
          email: user.email,
          created_at: user.created_at,
        });
      }
    });
  }, []);

  return <>{children}</>;
}
