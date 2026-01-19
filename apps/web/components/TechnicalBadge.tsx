"use client";

import { Camera, Move, Film, LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

type BadgeType = "shot" | "movement" | "transition";

interface TechnicalBadgeProps {
  type: BadgeType;
  value: string;
}

const badgeConfig: Record<BadgeType, {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
  translationKey: 'shotTypes' | 'cameraMovements' | 'transitions';
}> = {
  shot: {
    icon: Camera,
    bgColor: "bg-blue-900/30",
    textColor: "text-blue-400",
    borderColor: "border-blue-800/50",
    translationKey: 'shotTypes',
  },
  movement: {
    icon: Move,
    bgColor: "bg-green-900/30",
    textColor: "text-green-400",
    borderColor: "border-green-800/50",
    translationKey: 'cameraMovements',
  },
  transition: {
    icon: Film,
    bgColor: "bg-orange-900/30",
    textColor: "text-orange-400",
    borderColor: "border-orange-800/50",
    translationKey: 'transitions',
  },
};

export function TechnicalBadge({ type, value }: TechnicalBadgeProps) {
  const tShot = useTranslations('storyboard.technicalBadge.shotTypes');
  const tMovement = useTranslations('storyboard.technicalBadge.cameraMovements');
  const tTransition = useTranslations('storyboard.technicalBadge.transitions');

  const config = badgeConfig[type];
  const Icon = config.icon;

  // Get the appropriate translation function based on type
  const getTranslation = () => {
    const translators: Record<string, typeof tShot> = {
      shotTypes: tShot,
      cameraMovements: tMovement,
      transitions: tTransition,
    };
    return translators[config.translationKey];
  };

  // Try to get translation for the value
  const getExplanation = (): string | undefined => {
    const t = getTranslation();

    // Try different key formats
    const keysToTry = [value, value.toLowerCase(), value.toUpperCase()];

    for (const key of keysToTry) {
      try {
        // Check if key exists using has() if available, otherwise try to get
        const result = t(key as any);
        // If the result doesn't contain a dot (which would indicate it's returning the key path), it's a valid translation
        if (result && typeof result === 'string' && !result.includes('storyboard.technicalBadge')) {
          return result;
        }
      } catch {
        // Key not found, try next
      }
    }

    return undefined;
  };

  const explanation = getExplanation();

  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.bgColor} ${config.textColor} text-xs rounded-full border ${config.borderColor} cursor-help`}
    >
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );

  if (!explanation) {
    return badge;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-gray-900 border-gray-700 text-gray-100"
        >
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
