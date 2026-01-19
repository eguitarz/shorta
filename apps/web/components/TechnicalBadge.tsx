"use client";

import { Camera, Move, Film, LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Filmmaking glossary - explanations for technical terms
const FILMMAKING_GLOSSARY: Record<string, string> = {
  // Shot Types
  "ECU": "Extreme Close-Up: Very tight shot on a specific detail (eyes, hands, object)",
  "CU": "Close-Up: Tight shot of a face or object, showing emotion or detail",
  "MCU": "Medium Close-Up: Head and shoulders framing, common for dialogue",
  "MS": "Medium Shot: Waist-up framing, balances subject and environment",
  "MWS": "Medium Wide Shot: Knee-up framing, shows body language",
  "WS": "Wide Shot: Full body with some environment visible",
  "EWS": "Extreme Wide Shot: Establishes location, subject appears small",
  "POV": "Point of View: Camera shows what a character sees",
  "OTS": "Over the Shoulder: Shot from behind one person looking at another",
  "2-shot": "Two Shot: Frame includes two people",
  "insert": "Insert Shot: Close-up of an object or detail relevant to the scene",

  // Camera Movements
  "static": "Static: Camera stays fixed in position",
  "pan": "Pan: Camera rotates horizontally left or right",
  "tilt": "Tilt: Camera rotates vertically up or down",
  "dolly": "Dolly: Camera physically moves toward or away from subject",
  "truck": "Truck: Camera physically moves left or right",
  "zoom": "Zoom: Lens adjusts to make subject appear closer/farther",
  "push": "Push In: Camera or zoom moves closer to subject for emphasis",
  "pull": "Pull Out: Camera or zoom moves away from subject",
  "tracking": "Tracking Shot: Camera follows a moving subject",
  "handheld": "Handheld: Camera held by operator for natural, organic movement",
  "steadicam": "Steadicam: Stabilized camera for smooth movement while walking",
  "crane": "Crane Shot: Camera moves vertically using a crane or jib",
  "whip": "Whip Pan: Very fast pan creating motion blur, often used for transitions",
  "arc": "Arc: Camera moves in a curved path around the subject",

  // Transitions
  "cut": "Cut: Instant switch from one shot to another",
  "jump cut": "Jump Cut: Abrupt cut within the same shot, creates jarring effect",
  "match cut": "Match Cut: Cut between two similar shapes or actions",
  "fade": "Fade: Gradual transition to/from black or white",
  "dissolve": "Dissolve: One shot gradually blends into another",
  "wipe": "Wipe: New shot slides in over the previous shot",
  "J-cut": "J-Cut: Audio from next scene starts before the visual",
  "L-cut": "L-Cut: Audio from previous scene continues over new visual",
  "smash cut": "Smash Cut: Abrupt cut for dramatic contrast or comedic effect",
};

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
}> = {
  shot: {
    icon: Camera,
    bgColor: "bg-blue-900/30",
    textColor: "text-blue-400",
    borderColor: "border-blue-800/50",
  },
  movement: {
    icon: Move,
    bgColor: "bg-green-900/30",
    textColor: "text-green-400",
    borderColor: "border-green-800/50",
  },
  transition: {
    icon: Film,
    bgColor: "bg-orange-900/30",
    textColor: "text-orange-400",
    borderColor: "border-orange-800/50",
  },
};

export function TechnicalBadge({ type, value }: TechnicalBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  // Look up explanation (case-insensitive)
  const normalizedValue = value.toLowerCase();
  const explanation = FILMMAKING_GLOSSARY[normalizedValue] || FILMMAKING_GLOSSARY[value];

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
