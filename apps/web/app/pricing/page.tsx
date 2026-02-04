'use client';

import { useState } from 'react';
import { Check, Zap, Crown, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Hobby',
    icon: Zap,
    price: { monthly: 8, yearly: 6 },
    description: 'Best for casual creators & testing ideas',
    features: [
      '1,000 credits / month',
      '~10 storyboards',
      'Credits roll over (up to 1.5x cap)',
    ],
    paymentLinkUrl: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_HOBBY_MONTHLY_PAYMENT_LINK!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_HOBBY_YEARLY_PAYMENT_LINK!,
    }
  },
  {
    name: 'Pro',
    icon: Crown,
    price: { monthly: 18, yearly: 15 },
    description: 'Best for weekly Shorts creators',
    isPopular: true,
    features: [
      '3,500 credits / month',
      '~35 storyboards',
      'Credits roll over (up to 1.5x cap)',
    ],
    paymentLinkUrl: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PAYMENT_LINK!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PAYMENT_LINK!,
    }
  },
  {
    name: 'Producer',
    icon: Gem,
    price: { monthly: 56, yearly: 45 },
    description: 'Best for daily creators, teams, studios',
    features: [
      '12,000 credits / month',
      '~120 storyboards',
      'Credits roll over (up to 2x cap)',
      'Priority processing on feedback',
    ],
    paymentLinkUrl: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRODUCER_MONTHLY_PAYMENT_LINK!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRODUCER_YEARLY_PAYMENT_LINK!,
    }
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  
  const handleCheckout = async (paymentLinkUrl: string) => {
    if (!paymentLinkUrl || paymentLinkUrl.includes('undefined')) {
      alert('This plan has not been configured by the site administrator yet. Please check your .env.local file for payment link URLs.');
      return;
    }
    
    window.location.href = paymentLinkUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-400">
            The production system for YouTube Shorts creators
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={cn('text-lg', { 'text-gray-400': billingCycle === 'yearly' })}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-8 bg-gray-700 rounded-full p-1 transition-all"
          >
            <span
              className={cn(
                'absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform',
                { 'transform translate-x-6': billingCycle === 'yearly' }
              )}
            />
          </button>
          <span className={cn('text-lg', { 'text-gray-400': billingCycle === 'monthly' })}>
            Yearly
          </span>
           <span className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-semibold ml-2">
            Save 20-33%
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 transition-all hover:border-gray-700 flex flex-col',
                {
                  'border-2 border-orange-500 relative': plan.isPopular,
                }
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <plan.icon className="w-10 h-10 text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6 h-10">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price[billingCycle]}</span>
                <span className="text-gray-400">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleCheckout(plan.paymentLinkUrl[billingCycle])}
                className={cn(
                  'w-full py-3 rounded-lg font-semibold transition-colors',
                  {
                    'bg-orange-500 hover:bg-orange-600 text-white': plan.isPopular,
                    'bg-gray-800 hover:bg-gray-700': !plan.isPopular,
                  }
                )}
              >
                {plan.name === 'Hobby' ? 'Get Started' : `Start ${plan.name} Plan`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>All plans can be cancelled at any time.</p>
        </div>
      </div>
    </div>
  );
}
