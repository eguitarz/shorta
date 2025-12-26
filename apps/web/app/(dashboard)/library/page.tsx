import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import LibraryContent from "./library-content";

export const runtime = 'edge';

const ALLOWED_EMAIL = "dalema22@gmail.com";

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Check if user email is allowed
  if (user.email !== ALLOWED_EMAIL) {
    redirect("/launching-soon");
  }

  return <LibraryContent />;
}
