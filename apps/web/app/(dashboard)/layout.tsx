import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";

const ALLOWED_EMAIL = "dalema22@gmail.com";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
