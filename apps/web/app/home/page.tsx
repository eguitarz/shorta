import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardContent from "./dashboard-content";

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

  return <DashboardContent user={user} />;
}
