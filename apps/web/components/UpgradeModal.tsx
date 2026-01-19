'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  tier: 'anonymous' | 'free';
}

/**
 * Modal shown when users click on restricted features
 * Prompts users to upgrade to unlock premium features
 */
export function UpgradeModal({ isOpen, onClose, feature, tier }: UpgradeModalProps) {
  const t = useTranslations('upgrade');

  if (!isOpen) return null;

  const featureNames: Record<string, string> = {
    'performance-cards': t('features.performance-cards'),
    'apply-fix': t('features.apply-fix'),
    'suggest-metadata': t('features.suggest-metadata'),
    're-hook': t('features.re-hook'),
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3
          id="upgrade-modal-title"
          className="text-xl font-bold text-white mb-2"
        >
          {t('title')}
        </h3>

        {/* Feature name */}
        <p className="text-gray-400 mb-4">
          {featureNames[feature] || t('feature')}
        </p>

        {/* Message */}
        <p className="text-gray-300 mb-6">
          {t('message')}
        </p>

        {/* CTA button */}
        <a
          href="/pricing"
          className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-center font-semibold transition-colors"
        >
          {t('cta')}
        </a>
      </div>
    </>
  );
}
