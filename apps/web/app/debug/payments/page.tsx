'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Bug, ExternalLink, AlertTriangle } from 'lucide-react';

interface UserProfile {
  user_id: string;
  tier: string;
  credits: number;
  credits_cap: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  last_sign_in_at: string | null;
  last_visited_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Summary {
  total: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
}

interface PaymentsData {
  profiles: UserProfile[];
  summary: Summary;
}

interface Issue {
  user_id: string;
  tier: string;
  message: string;
}

const TIERS = ['all', 'free', 'hobby', 'pro', 'producer', 'founder', 'lifetime'] as const;
const STATUSES = ['all', 'active', 'canceling', 'canceled', 'past_due', 'trialing', 'null'] as const;

function getTierColor(tier: string) {
  switch (tier) {
    case 'hobby': return 'bg-blue-500/10 text-blue-400';
    case 'pro': return 'bg-green-500/10 text-green-400';
    case 'producer': return 'bg-yellow-500/10 text-yellow-400';
    case 'founder': return 'bg-orange-500/10 text-orange-400';
    case 'lifetime': return 'bg-purple-500/10 text-purple-400';
    default: return 'bg-gray-800 text-gray-400';
  }
}

function getStatusColor(status: string | null) {
  switch (status) {
    case 'active': return 'bg-green-500/10 text-green-400';
    case 'canceling': return 'bg-orange-500/10 text-orange-400';
    case 'canceled': return 'bg-red-500/10 text-red-400';
    case 'past_due': return 'bg-yellow-500/10 text-yellow-400';
    case 'trialing': return 'bg-blue-500/10 text-blue-400';
    default: return 'bg-gray-800 text-gray-500';
  }
}

function relativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function truncateId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function detectIssues(profiles: UserProfile[]): Issue[] {
  const issues: Issue[] = [];
  for (const p of profiles) {
    if (p.tier !== 'free' && p.tier !== 'founder' && p.tier !== 'lifetime' && !p.stripe_customer_id) {
      issues.push({ user_id: p.user_id, tier: p.tier, message: `Paid tier "${p.tier}" but missing stripe_customer_id` });
    }
    if (p.subscription_status === 'active' && p.credits === 0 && p.tier !== 'founder') {
      issues.push({ user_id: p.user_id, tier: p.tier, message: 'Active subscription but 0 credits remaining' });
    }
    if (p.tier !== 'free' && p.tier !== 'founder' && p.tier !== 'lifetime' && !p.stripe_subscription_id) {
      issues.push({ user_id: p.user_id, tier: p.tier, message: `Paid tier "${p.tier}" but missing stripe_subscription_id` });
    }
    if (p.subscription_status === 'canceled' && p.credits > 0) {
      issues.push({ user_id: p.user_id, tier: p.tier, message: `Canceled subscription but still has ${p.credits} credits` });
    }
  }
  return issues;
}

export default function DebugPaymentsPage() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug/payments');
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to load payments data');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-lg">Loading payment data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load</h2>
          <p className="text-gray-400 mb-4">{error || 'Could not load payment data'}</p>
        </div>
      </div>
    );
  }

  const { profiles, summary } = data;
  const issues = detectIssues(profiles);

  const filteredProfiles = profiles.filter((p) => {
    if (tierFilter !== 'all' && p.tier !== tierFilter) return false;
    if (statusFilter !== 'all') {
      const profileStatus = p.subscription_status ?? 'null';
      if (profileStatus !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">Debug View - Payments - Development Only</span>
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Payment & Subscription Monitor</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="text-3xl font-bold">{summary.total}</div>
            <div className="text-sm text-gray-400 mt-1">Total Users</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="text-3xl font-bold text-green-400">{summary.byStatus.active ?? 0}</div>
            <div className="text-sm text-gray-400 mt-1">Active Subscriptions</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="text-3xl font-bold text-red-400">{summary.byStatus.canceled ?? 0}</div>
            <div className="text-sm text-gray-400 mt-1">Canceled</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="text-3xl font-bold">
              {summary.total - (summary.byTier.free ?? 0)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Paying Users</div>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="bg-gray-900 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">By Tier</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.byTier).map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${getTierColor(tier)}`}>
                  {tier}
                </span>
                <span className="text-sm font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issues Panel */}
        {issues.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">
                Potential Issues ({issues.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <a
                    href={`/debug/user/${issue.user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-orange-400 hover:text-orange-300 shrink-0"
                  >
                    {truncateId(issue.user_id)}
                  </a>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getTierColor(issue.tier)}`}>
                    {issue.tier}
                  </span>
                  <span className="text-gray-300">{issue.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Tier:</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'All Tiers' : t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s === 'null' ? 'No Status' : s}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 ml-auto">
            Showing {filteredProfiles.length} of {profiles.length} users
          </span>
        </div>

        {/* User Table */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Credits</th>
                  <th className="px-4 py-3 font-medium">Cap</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Stripe Customer</th>
                  <th className="px-4 py-3 font-medium">Last Visit</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => (
                  <tr
                    key={profile.user_id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => window.open(`/debug/user/${profile.user_id}`, '_blank')}
                  >
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-300 font-mono">
                        {truncateId(profile.user_id)}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(profile.tier)}`}>
                        {profile.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {profile.credits}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {profile.credits_cap}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(profile.subscription_status)}`}>
                        {profile.subscription_status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-500 font-mono">
                        {profile.stripe_customer_id ? truncateId(profile.stripe_customer_id) : '—'}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {profile.last_visited_at ? relativeTime(profile.last_visited_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {profile.last_sign_in_at ? relativeTime(profile.last_sign_in_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {relativeTime(profile.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No users match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
