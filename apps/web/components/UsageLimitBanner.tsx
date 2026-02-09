'use client';

interface UsageLimitBannerProps {
  tier: 'anonymous' | 'free' | 'founder' | 'lifetime' | 'hobby' | 'pro' | 'producer';
  remaining: number;
}

/**
 * Banner shown at the top of analysis results
 * Displays remaining analyses and upgrade CTA
 */
export function UsageLimitBanner({ tier, remaining }: UsageLimitBannerProps) {
  // Don't show banner for paid users
  if (tier === 'founder' || tier === 'lifetime' || tier === 'hobby' || tier === 'pro' || tier === 'producer') {
    return null;
  }

  const getMessage = () => {
    if (tier === 'anonymous') {
      return 'This was your free trial. Upgrade to Pro for full access!';
    }

    // Free tier (logged-in users - though we don't use this anymore)
    if (remaining === 0) {
      return 'Upgrade to Pro for full access!';
    }
    return `${remaining} free ${remaining === 1 ? 'analysis' : 'analyses'} remaining. Upgrade for full access!`;
  };

  const action = { label: 'Upgrade', href: '/pricing' };

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-orange-400 flex-1 min-w-0">
          {getMessage()}
        </p>
        <a
          href={action.href}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {action.label}
        </a>
      </div>
    </div>
  );
}
