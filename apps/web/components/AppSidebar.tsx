"use client";

import { Home, BarChart3, Hammer, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import SignOutButton from "@/app/(dashboard)/home/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSwitcher } from "@/components/language-switcher";

const shortaLogo = "/shorta-logo.png";

interface AppSidebarProps {
  user: any;
}

interface UsageData {
  tier: 'anonymous' | 'free' | 'founder' | 'lifetime';
  analyses_remaining: number;
  analyses_limit: number;
}

function CollapseButton() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      onClick={toggleSidebar}
      className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-[#141414] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tTier = useTranslations('tier');

  const initials = user.email?.split("@")[0].slice(0, 2).toUpperCase() || "JD";

  // Fetch usage data
  useEffect(() => {
    fetch('/api/usage/check')
      .then(res => res.json())
      .then(data => setUsageData(data))
      .catch(console.error);
  }, []);

  const navItems = [
    { name: t('home'), icon: Home, path: "/home" },
    { name: t('draft'), icon: Hammer, path: "/draft" },
    { name: t('analyzer'), icon: BarChart3, path: "/analyzer" },
    { name: t('library'), icon: BookOpen, path: "/library" },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-800 bg-[#141414]"
    >
      <CollapseButton />

      {/* Logo */}
      <SidebarHeader className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img src={shortaLogo} alt="Shorta" className="h-8 w-8 shrink-0" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Shorta</span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                      : "text-gray-400 hover:bg-gray-800/50"
                    }`}
                >
                  <Link href={item.path} prefetch={true}>
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer - Language, Credits + User Profile */}
      <SidebarFooter className="p-4 border-t border-gray-800">
        {/* Language switcher - hidden when collapsed */}
        <div className="mb-4 group-data-[collapsible=icon]:hidden">
          <LanguageSwitcher />
        </div>
        {/* Compact language switcher - only show when collapsed */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Credits section - only show for free/anonymous tiers, hidden when collapsed */}
        {usageData && (usageData.tier === 'free' || usageData.tier === 'anonymous') && (
          <div className="mb-4 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {tCommon('analyses')}
              </span>
              <span className="text-sm font-semibold text-white">
                {tCommon('analysesRemaining', { remaining: usageData.analyses_remaining, limit: usageData.analyses_limit })}
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{
                  width: `${(usageData.analyses_remaining / usageData.analyses_limit) * 100}%`
                }}
              />
            </div>
            <Link
              href="/pricing"
              className="block text-sm text-orange-500 hover:text-orange-400 font-medium mt-2"
            >
              {tCommon('upgrade')}
            </Link>
          </div>
        )}

        {/* User Profile */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800 group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:border-t-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-semibold shrink-0 cursor-default">
                  {initials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="group-data-[state=expanded]:hidden">
                <p>{user.email?.split("@")[0]}</p>
                {usageData && (
                  <p className="text-xs text-gray-400 capitalize">
                    {tTier(usageData.tier)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-medium text-white truncate">
                {user.email?.split("@")[0]}
              </div>
              {usageData && (
                <div className="text-xs text-gray-500 capitalize">
                  {tTier(usageData.tier)}
                </div>
              )}
            </div>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <SignOutButton />
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
