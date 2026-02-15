const PAID_TIERS = ['hobby', 'pro', 'producer', 'founder', 'lifetime'] as const;

export function isPaidTier(tier: string): boolean {
  return (PAID_TIERS as readonly string[]).includes(tier);
}
