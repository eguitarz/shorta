"use client";

import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <Button onClick={handleSignOut} variant="outline" size="sm">
      Sign Out
    </Button>
  );
}
