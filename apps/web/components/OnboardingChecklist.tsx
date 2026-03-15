"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, X, ChevronRight, BarChart3, Wand2, Youtube } from "lucide-react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "shorta_onboarding_dismissed_v1";

interface Step {
  id: string;
  icon: React.ReactNode;
  accentClass: string;
  href: string;
}

interface OnboardingChecklistProps {
  /** Number of completed analyses the user has */
  analysisCount: number;
  /** Number of storyboards the user has created */
  storyboardCount: number;
}

export function OnboardingChecklist({ analysisCount, storyboardCount }: OnboardingChecklistProps) {
  const t = useTranslations("dashboard.onboarding");
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [mounted, setMounted] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem(DISMISS_KEY) === "true";
    setDismissed(wasDismissed);

    // Fetch YouTube connection status
    fetch("/api/auth/youtube/status")
      .then((r) => r.json())
      .then((data) => setYoutubeConnected(!!data?.connected))
      .catch(() => {});
  }, []);

  const steps: (Step & { completed: boolean })[] = [
    {
      id: "analyze",
      icon: <BarChart3 className="w-5 h-5" />,
      accentClass: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      href: "/home",
      completed: analysisCount >= 1,
    },
    {
      id: "storyboard",
      icon: <Wand2 className="w-5 h-5" />,
      accentClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      href: "/storyboard/create",
      completed: storyboardCount >= 1,
    },
    {
      id: "youtube",
      icon: <Youtube className="w-5 h-5" />,
      accentClass: "text-red-400 bg-red-500/10 border-red-500/20",
      href: "/home?connect=youtube",
      completed: youtubeConnected,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  // Auto-dismiss when all steps are complete
  useEffect(() => {
    if (mounted && allDone) {
      localStorage.setItem(DISMISS_KEY, "true");
      setDismissed(true);
    }
  }, [mounted, allDone]);

  if (!mounted || dismissed) return null;

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
            {t("label")}
          </p>
          <h3 className="text-xl font-semibold text-white">{t("title")}</h3>
          <p className="text-sm text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
          aria-label={t("dismiss")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{t("progress", { done: completedCount, total: steps.length })}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => !step.completed && router.push(step.href)}
            disabled={step.completed}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              step.completed
                ? "bg-gray-900/30 border-gray-800/50 opacity-60 cursor-default"
                : "bg-gray-900/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/60 cursor-pointer group"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${step.accentClass}`}
            >
              {step.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${
                  step.completed ? "line-through text-gray-500" : "text-white"
                }`}
              >
                {t(`step.${step.id}.title`)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t(`step.${step.id}.description`)}
              </p>
            </div>

            {/* Status */}
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <div className="flex items-center gap-1 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0">
                <Circle className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
