"use client";

import { useRouter } from "next/navigation";
import { Upload, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ChannelEncouragementProps {
  shortsCount: number;
  minRequired?: number;
}

export function ChannelEncouragement({
  shortsCount,
  minRequired = 3,
}: ChannelEncouragementProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.channelEncouragement");
  const progress = Math.min(shortsCount / minRequired, 1);

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold">{t("title")}</h3>
          <p className="text-sm text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{t("progress")}</span>
          <span className="text-sm font-medium text-orange-400">
            {shortsCount}/{minRequired}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{t("message")}</p>

      {/* Tips */}
      <div className="space-y-2 mb-4">
        {[t("tip1"), t("tip2"), t("tip3")].map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
            <Lightbulb className="w-3.5 h-3.5 text-orange-500/50 mt-0.5 shrink-0" />
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => router.push("/home")}
        variant="outline"
        size="sm"
        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
      >
        <Upload className="w-4 h-4 mr-2" />
        {t("analyzeButton")}
      </Button>
    </div>
  );
}
