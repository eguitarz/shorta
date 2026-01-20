"use client";

import { useState } from "react";
import { Check, Zap, HelpCircle, Heart, Hash, ChevronDown, ChevronUp, Sparkles, Library } from "lucide-react";
import { useTranslations } from "next-intl";

export type HookVariantStyle = 'bold' | 'question' | 'emotional' | 'specific' | 'library';

export interface HookVariant {
  id: string;
  style: HookVariantStyle;
  label: string;
  script: string;
  visual: string;
  audio: string;
  directorNotes: string;
  whyItWorks: string;
}

interface HookVariantSelectorProps {
  variants: HookVariant[];
  selectedId: string;
  onSelect: (variant: HookVariant) => void;
}

const STYLE_CONFIG: Record<HookVariantStyle, { icon: typeof Zap; color: string; bgColor: string; borderColor: string }> = {
  bold: {
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-700/50'
  },
  question: {
    icon: HelpCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700/50'
  },
  emotional: {
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/20',
    borderColor: 'border-pink-700/50'
  },
  specific: {
    icon: Hash,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700/50'
  },
  library: {
    icon: Library,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/50'
  },
};

export function HookVariantSelector({ variants, selectedId, onSelect }: HookVariantSelectorProps) {
  const t = useTranslations('storyboard.resultPage.hookSelector');
  const tVariants = useTranslations('storyboard.hookVariants');
  const tFields = useTranslations('storyboard.fields');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!variants || variants.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <span className="text-sm text-gray-500">({variants.length} {tVariants('options')})</span>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        {t('description')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variants.map((variant) => {
          const config = STYLE_CONFIG[variant.style] || STYLE_CONFIG.bold;
          const Icon = config.icon;
          const isSelected = variant.id === selectedId;
          const isExpanded = expandedId === variant.id;

          return (
            <div
              key={variant.id}
              className={`
                relative rounded-lg border transition-all duration-200 overflow-hidden
                ${isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : `${config.borderColor} hover:border-gray-600`
                }
              `}
            >
              {/* Header - Clickable to select */}
              <button
                onClick={() => onSelect(variant)}
                className={`
                  w-full p-4 text-left transition-colors
                  ${isSelected ? 'bg-purple-900/20' : config.bgColor}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{variant.label}</h3>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            {tVariants('selected')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                        &ldquo;{variant.script}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Why it works - Expandable */}
              <div className="border-t border-gray-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(variant.id);
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
                >
                  <span>{tVariants('whyThisWorks')}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 text-sm text-gray-400 border-t border-gray-800/50 pt-3">
                    <p className="mb-3">{variant.whyItWorks}</p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-1">{tFields('visual')}</p>
                        <ul className="space-y-0.5">
                          {variant.visual.split('\n').filter(l => l.trim()).map((line, i) => (
                            <li key={i} className="text-gray-400">
                              {line.replace(/^[•\-\*]\s*/, '• ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-1">{tFields('audio')}</p>
                        <ul className="space-y-0.5">
                          {variant.audio.split('\n').filter(l => l.trim()).map((line, i) => (
                            <li key={i} className="text-gray-400">
                              {line.replace(/^[•\-\*]\s*/, '• ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
