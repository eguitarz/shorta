'use client';

import { Check, Zap, Crown, Infinity } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Analyze viral shorts and master retention-focused storytelling
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
            <Zap className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 mb-6">Try before you commit</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">1 free trial analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Beat-by-beat breakdown</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Share analysis results</span>
              </li>
            </ul>

            <a
              href="/try"
              className="block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-center"
            >
              Try for Free
            </a>
          </div>

          {/* Pro Tier - Most Popular */}
          <div className="bg-gradient-to-b from-orange-500/10 to-[#1a1a1a] border-2 border-orange-500 rounded-2xl p-8 relative scale-105 hover:scale-[1.06] transition-transform">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>

            <Crown className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-gray-400 mb-6">
              <span className="line-through text-gray-500">$399/year</span> after launch
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-gray-400">/year</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Unlimited analyses</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Full performance insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">AI-powered fix suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Title & description generator</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Viral hook variants</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-400">Price locked forever at $99/year</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-400">Limited seats available</span>
              </li>
            </ul>

            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#'}
              className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-center"
            >
              Start Pro Plan
            </a>
          </div>

          {/* Lifetime Tier - Limited */}
          <div className="bg-[#1a1a1a] border border-purple-500/50 rounded-2xl p-8 relative hover:border-purple-500 transition-colors">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Limited to 20
            </div>

            <Infinity className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Lifetime</h3>
            <p className="text-gray-400 mb-6">Pay once, own forever</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$199</span>
              <span className="text-gray-400"> one-time</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Everything in Pro</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Lifetime access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">No recurring fees</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-purple-400">Limited to 20 seats</span>
              </li>
            </ul>

            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#'}
              className="block w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors text-center"
            >
              Get Lifetime Access
            </a>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>All plans include access to our AI-powered video analysis platform.</p>
          <p className="mt-2">Pro price locked at $99/year forever - never increases as long as subscription is active.</p>
        </div>
      </div>
    </div>
  );
}
