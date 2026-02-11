'use client';

import { useState } from 'react';
import { Check, Zap, Crown, Gem, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Hobby',
    icon: Zap,
    price: { monthly: 8, yearly: 6 },
    description: '가벼운 창작과 아이디어 테스트에 적합',
    features: [
      '월 1,000 크레딧',
      '~10개 스토리보드',
      '크레딧 이월 (최대 1.5배 한도)',
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
    description: '주간 쇼츠 크리에이터에 적합',
    isPopular: true,
    features: [
      '월 3,500 크레딧',
      '~35개 스토리보드',
      '크레딧 이월 (최대 1.5배 한도)',
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
    description: '일일 크리에이터, 팀, 스튜디오에 적합',
    features: [
      '월 12,000 크레딧',
      '~120개 스토리보드',
      '크레딧 이월 (최대 2배 한도)',
      '피드백 우선 처리',
    ],
    paymentLinkUrl: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRODUCER_MONTHLY_PAYMENT_LINK!,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRODUCER_YEARLY_PAYMENT_LINK!,
    }
  },
];

export default function KoreanPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const handleCheckout = async (paymentLinkUrl: string) => {
    if (!paymentLinkUrl || paymentLinkUrl.includes('undefined')) {
      alert('이 요금제는 아직 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    window.location.href = paymentLinkUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">요금제 선택</h1>
          <p className="text-xl text-gray-400">
            유튜브 쇼츠 크리에이터를 위한 제작 시스템
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={cn('text-lg', { 'text-gray-400': billingCycle === 'yearly' })}>
            월간
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
            연간
          </span>
           <span className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-semibold ml-2">
            20-33% 절약
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Tier */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 transition-all hover:border-gray-700 flex flex-col">
            <User className="w-10 h-10 text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 mb-6 h-10">체험해 보세요 — 신용카드 불필요</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/영구</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {['가입 시 300 크레딧', '~3개 스토리보드', '전체 분석 기능'].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/login"
              className="w-full py-3 rounded-lg font-semibold transition-colors bg-gray-800 hover:bg-gray-700 text-center block"
            >
              무료 계정 만들기
            </a>
          </div>

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
                  인기
                </div>
              )}

              <plan.icon className="w-10 h-10 text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6 h-10">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price[billingCycle]}</span>
                <span className="text-gray-400">/월</span>
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
                {plan.name === 'Hobby' ? '시작하기' : `${plan.name} 플랜 시작`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>모든 요금제는 언제든지 해지할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
