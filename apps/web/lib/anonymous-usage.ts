import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';
import { getClientIp, hashIP } from '@/lib/ip-hash';

type AnonymousUsageCheck = {
  allowed: boolean;
  ipHash: string;
  analysesUsed: number;
  isDevBypass: boolean;
};

export async function checkAnonymousTrial(request: NextRequest): Promise<AnonymousUsageCheck> {
  const clientIp = getClientIp(request);
  const ipHash = await hashIP(clientIp);
  const supabase = createServiceClient();

  const { data: existingUsage, error } = await supabase
    .from('anonymous_usage')
    .select('analyses_used')
    .eq('ip_hash', ipHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const analysesUsed = existingUsage?.analyses_used || 0;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowed = isDevelopment || analysesUsed < 1;

  return {
    allowed,
    ipHash,
    analysesUsed,
    isDevBypass: isDevelopment && analysesUsed >= 1,
  };
}

export async function recordAnonymousUsage(ipHash: string, analysesUsed: number) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('anonymous_usage')
    .upsert(
      { ip_hash: ipHash, analyses_used: analysesUsed },
      { onConflict: 'ip_hash' }
    )
    .select('analyses_used')
    .single();

  if (error) {
    throw error;
  }

  return data?.analyses_used ?? analysesUsed;
}
