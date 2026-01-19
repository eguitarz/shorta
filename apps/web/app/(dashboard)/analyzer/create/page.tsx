"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Link as LinkIcon, Upload } from "lucide-react";
import { VideoUpload } from "@/components/video-upload";
import { useTranslations } from "next-intl";

type InputMode = "url" | "upload";

export default function CreateAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('analyzer.create');
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError(t('errors.enterUrl'));
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim());
    } catch {
      setError(t('errors.invalidUrl'));
      return;
    }

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    if (!youtubeRegex.test(url.trim())) {
      setError(t('errors.youtubeOnly'));
      return;
    }

    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store URL in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      url: url.trim(),
      status: "pending"
    }));

    // Navigate to results page where analysis will happen
    router.push(`/analyzer/${analysisId}`);
  };

  const handleUploadComplete = (fileUri: string, fileName: string) => {
    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store fileUri in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      fileUri,
      fileName,
      status: "pending"
    }));

    // Navigate to results page where analysis will happen
    router.push(`/analyzer/${analysisId}`);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            {t('breadcrumb.projects')}
          </button>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            {t('breadcrumb.myNewShort')}
          </button>
          <button className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
            {t('breadcrumb.createAnalysis')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 bg-black/50 rounded-lg w-fit mb-6">
              <button
                onClick={() => { setInputMode("url"); setError(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${inputMode === "url"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                <LinkIcon className="w-4 h-4" />
                {t('urlTab')}
              </button>
              <button
                onClick={() => { setInputMode("upload"); setError(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${inputMode === "upload"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                <Upload className="w-4 h-4" />
                {t('uploadTab')}
              </button>
            </div>

            {inputMode === "url" ? (
              <form onSubmit={handleSubmit}>
                <label className="block mb-3">
                  <span className="text-sm text-gray-400 mb-2 block">
                    {t('urlLabel')}
                  </span>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t('placeholder')}
                      className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('button')}
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div>
                <span className="text-sm text-gray-400 mb-3 block">
                  {t('uploadLabel')}
                </span>
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
