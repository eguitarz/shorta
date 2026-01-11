import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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

  // Check if anonymous access is allowed (set by middleware for analyzer pages)
  const headersList = await headers();
  const allowAnonymous = headersList.get('x-allow-anonymous') === 'true';

  // If no user and not allowed anonymous access, redirect to login
  if (!user && !allowAnonymous) {
    redirect("/login");
  }

  // Check if user email is allowed (only for authenticated users)
  if (user && user.email !== ALLOWED_EMAIL) {
    redirect("/launching-soon");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#0a0a0a] text-white w-full">
        {/* Only show sidebar for authenticated users */}
        {user && <AppSidebar user={user} />}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
