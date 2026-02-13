"use client";

import { Home, BarChart3, Hammer, BookOpen, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  tier: 'anonymous' | 'free' | 'founder' | 'lifetime' | 'hobby' | 'pro' | 'producer';
  credits?: number | null;
  credits_cap?: number | null;
  can_create_storyboard?: boolean;
  current_period_end?: string | null;
}

// YouTube brand icon (simplified SVG path)
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

interface YouTubeStatus {
  connected: boolean;
  channelTitle: string | null;
  status: string | null;
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
  const [ytStatus, setYtStatus] = useState<YouTubeStatus | null>(null);
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tTier = useTranslations('tier');

  const initials = user.email?.split("@")[0].slice(0, 2).toUpperCase() || "JD";

  const fetchYtStatus = () => {
    fetch('/api/auth/youtube/status')
      .then(res => res.json())
      .then(data => setYtStatus(data))
      .catch(console.error);
  };

  // Fetch usage data on mount, navigation, and after credit changes
  useEffect(() => {
    const fetchUsage = () => {
      fetch('/api/usage/check')
        .then(res => res.json())
        .then(data => setUsageData(data))
        .catch(console.error);
    };
    fetchUsage();
    window.addEventListener('credits-changed', fetchUsage);
    return () => window.removeEventListener('credits-changed', fetchUsage);
  }, [pathname]);

  // Fetch YouTube status and listen for connection changes
  useEffect(() => {
    fetchYtStatus();

    const handleConnectionChange = () => fetchYtStatus();
    window.addEventListener('youtube-connection-changed', handleConnectionChange);
    return () => window.removeEventListener('youtube-connection-changed', handleConnectionChange);
  }, []);

  const navItems = [
    { name: t('home'), icon: Home, path: "/home" },
    { name: t('channel'), icon: User, path: "/channel" },
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

      {/* Footer - YouTube, Language, Credits + User Profile */}
      <SidebarFooter className="p-4 border-t border-gray-800">
        {/* YouTube connection indicator */}
        {ytStatus && (
          <>
            {/* Expanded view */}
            <Link
              href={ytStatus.connected ? "/home" : "/api/auth/youtube/initiate"}
              className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg transition-colors hover:bg-gray-800/50 group-data-[collapsible=icon]:hidden"
            >
              <div className="relative shrink-0">
                <YouTubeIcon className={`w-5 h-5 ${ytStatus.connected ? 'text-red-500' : 'text-gray-500'}`} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#141414] ${
                  ytStatus.connected
                    ? ytStatus.status === 'needs_reauth' ? 'bg-orange-500' : 'bg-green-500'
                    : 'bg-gray-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-300 block truncate">
                  {ytStatus.connected ? ytStatus.channelTitle || 'YouTube' : tCommon('connectYouTube')}
                </span>
                <span className={`text-[10px] ${ytStatus.connected ? 'text-green-500' : 'text-gray-500'}`}>
                  {ytStatus.connected
                    ? ytStatus.status === 'needs_reauth' ? tCommon('reconnectNeeded') : tCommon('channelConnected')
                    : tCommon('notConnected')
                  }
                </span>
              </div>
            </Link>
            {/* Collapsed view - icon only */}
            <div className="hidden group-data-[collapsible=icon]:flex justify-center mb-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={ytStatus.connected ? "/home" : "/api/auth/youtube/initiate"}
                    className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <YouTubeIcon className={`w-5 h-5 ${ytStatus.connected ? 'text-red-500' : 'text-gray-500'}`} />
                    <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-[#141414] ${
                      ytStatus.connected ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{ytStatus.connected ? ytStatus.channelTitle || 'YouTube Connected' : 'Connect YouTube'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}

        {/* Language switcher - hidden when collapsed */}
        <div className="mb-4 group-data-[collapsible=icon]:hidden">
          <LanguageSwitcher />
        </div>
        {/* Compact language switcher - only show when collapsed */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Upgrade prompt for free/anonymous tiers, hidden when collapsed */}
        {usageData && (usageData.tier === 'free' || usageData.tier === 'anonymous') && (
          <div className="mb-4 group-data-[collapsible=icon]:hidden">
            <Link
              href="/pricing"
              className="block text-sm text-orange-500 hover:text-orange-400 font-medium"
            >
              {tCommon('upgrade')}
            </Link>
          </div>
        )}

        {/* Unlimited badge for founders */}
        {usageData && usageData.tier === 'founder' && (
          <div className="mb-4 group-data-[collapsible=icon]:hidden">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Unlimited access
            </span>
          </div>
        )}

        {/* Credits display - show for free, lifetime and paid tiers */}
        {usageData && ['free', 'lifetime', 'hobby', 'pro', 'producer', 'beta'].includes(usageData.tier) && usageData.credits != null && (
          <div className="mb-4 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Credits
              </span>
              <span className="text-sm font-semibold text-white">
                {usageData.credits}
              </span>
            </div>
            {usageData.credits_cap != null && usageData.credits_cap > 0 && (
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (usageData.credits / usageData.credits_cap) * 100)}%`
                  }}
                />
              </div>
            )}
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
