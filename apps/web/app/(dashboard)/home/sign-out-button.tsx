"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('auth');

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
    <button
      onClick={handleSignOut}
      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
      title={t('signOut')}
    >
      <LogOut className="w-5 h-5 text-gray-400" />
    </button>
  );
}
