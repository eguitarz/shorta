"use client";

import { Home, BarChart3, Hammer, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/app/(dashboard)/home/sign-out-button";

const shortaLogo = "/shorta-logo.png";

interface AppSidebarProps {
  user: any;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const initials = user.email?.split("@")[0].slice(0, 2).toUpperCase() || "JD";

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Analyzer", icon: BarChart3, path: "/analyzer" },
    { name: "Build", icon: Hammer, path: "/build" },
    { name: "Library", icon: BookOpen, path: "/library" },
  ];

  return (
    <aside className="w-64 bg-[#141414] border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img src={shortaLogo} alt="Shorta" className="h-8 w-8" />
          <span className="text-xl font-semibold">Shorta</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                    : "text-gray-400 hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Credits + User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Credits
            </span>
            <span className="text-sm font-semibold text-white">450 left</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: "75%" }}
            />
          </div>
          <button className="text-sm text-orange-500 hover:text-orange-400 font-medium mt-2">
            Upgrade Plan
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.email?.split("@")[0]}
              </div>
              <div className="text-xs text-gray-500">Founding Member</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
