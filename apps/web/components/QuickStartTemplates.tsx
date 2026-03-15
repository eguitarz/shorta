"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, Flame, Repeat2, List, BookMarked, X, ArrowRight, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface Template {
  id: string;
  icon: React.ReactNode;
  accentColor: string;
  title: string;
  tagline: string;
  structure: string[];
  topicPlaceholder: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  tutorial: <BookOpen className="w-5 h-5" />,
  mistake: <AlertTriangle className="w-5 h-5" />,
  hottake: <Flame className="w-5 h-5" />,
  beforeafter: <Repeat2 className="w-5 h-5" />,
  listicle: <List className="w-5 h-5" />,
  story: <BookMarked className="w-5 h-5" />,
};

const ACCENT_MAP: Record<string, string> = {
  tutorial: "text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40",
  mistake: "text-orange-400 bg-orange-500/10 border-orange-500/20 group-hover:border-orange-500/40",
  hottake: "text-red-400 bg-red-500/10 border-red-500/20 group-hover:border-red-500/40",
  beforeafter: "text-green-400 bg-green-500/10 border-green-500/20 group-hover:border-green-500/40",
  listicle: "text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40",
  story: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 group-hover:border-yellow-500/40",
};

export function QuickStartTemplates() {
  const t = useTranslations("dashboard.templates");
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState("");

  const templateIds = ["tutorial", "mistake", "hottake", "beforeafter", "listicle", "story"] as const;

  const templates: Template[] = templateIds.map((id) => ({
    id,
    icon: ICON_MAP[id],
    accentColor: ACCENT_MAP[id],
    title: t(`${id}.title`),
    tagline: t(`${id}.tagline`),
    structure: [
      t(`${id}.step1`),
      t(`${id}.step2`),
      t(`${id}.step3`),
    ],
    topicPlaceholder: t(`${id}.placeholder`),
  }));

  const handleTemplateClick = (templateId: string) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
      setTopicInput("");
    } else {
      setSelectedTemplate(templateId);
      setTopicInput("");
    }
  };

  const handleGenerate = () => {
    if (!selectedTemplate || !topicInput.trim()) return;
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Build a structured topic prompt
    const fullTopic = `${template.title}: ${topicInput.trim()}`;
    router.push(`/storyboard/create?topic=${encodeURIComponent(fullTopic)}`);
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
        <Zap className="w-4 h-4" />
        <span>{t("label")}</span>
      </div>
      <h2 className="text-2xl font-semibold mb-1">{t("title")}</h2>
      <p className="text-sm text-gray-400 mb-6">{t("subtitle")}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template.id)}
              className={`group relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? template.accentColor.replace("group-hover:", "")
                  : "border-gray-800 bg-[#141414] hover:bg-[#1a1a1a]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  isSelected
                    ? template.accentColor.split(" ").slice(0, 3).join(" ")
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}
              >
                {template.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight mb-0.5 ${isSelected ? "" : "text-white"}`}>
                  {template.title}
                </p>
                <p className="text-xs text-gray-500 leading-snug">{template.tagline}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded template detail + topic input */}
      {activeTemplate && (
        <div className={`mt-4 p-5 rounded-xl border transition-all ${activeTemplate.accentColor.split(" ").slice(0, 3).join(" ")} border-current/30`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold mb-1">{activeTemplate.title}</h3>
              <div className="flex flex-wrap gap-2">
                {activeTemplate.structure.map((step, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-black/30 text-gray-300 border border-white/10"
                  >
                    {i + 1}. {step}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setSelectedTemplate(null); setTopicInput(""); }}
              className="p-1.5 rounded-lg hover:bg-black/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={activeTemplate.topicPlaceholder}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && topicInput.trim() && handleGenerate()}
              autoFocus
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-white/20 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={!topicInput.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("generate")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
