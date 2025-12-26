import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SignOutButton from "./sign-out-button";

const shortaLogo = "/shorta-logo.png";

export const runtime = 'edge';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={shortaLogo} alt="Shorta" className="h-12" />
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Welcome to Shorta!
          </h1>
          <p className="text-muted-foreground mb-8">
            Hey {user.email}! You're successfully signed in.
          </p>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Profile
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="text-foreground">{user.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">User ID:</span>
                <p className="text-foreground font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Last sign in:
                </span>
                <p className="text-foreground">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Coming Soon
            </h2>
            <p className="text-muted-foreground mb-4">
              The Shorta app is currently in development. As a Founding Member,
              you'll get early access once we launch!
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Viral Shorts script generation</p>
              <p>✓ Hook analysis and ranking</p>
              <p>✓ Performance-optimized storyboards</p>
              <p>✓ Your personal Shorts library</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
