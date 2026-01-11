"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Link as LinkIcon, Upload, Zap } from "lucide-react";
import { VideoUpload } from "@/components/video-upload";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type InputMode = "url" | "upload";

export default function TryAnalyzerPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim());
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/;
    if (!youtubeRegex.test(url.trim())) {
      setError("Only YouTube URLs are supported");
      return;
    }

    // Show CAPTCHA if not verified yet
    if (!turnstileToken) {
      setShowCaptcha(true);
      setError("Please complete the verification");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create analysis job via API
      const response = await fetch('/api/jobs/analysis/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create analysis');
      }

      // Navigate to trial results page
      router.push(`/try/${data.job_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setLoading(false);
      // Keep CAPTCHA token - user already verified
    }
  };

  const handleUploadComplete = async (fileUri: string, fileName: string) => {
    if (!turnstileToken) {
      setShowCaptcha(true);
      setError("Please complete the verification");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create analysis job via API
      const response = await fetch('/api/jobs/analysis/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUri,
          fileName,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create analysis');
      }

      // Navigate to trial results page
      router.push(`/try/${data.job_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setLoading(false);
      // Keep CAPTCHA token - user already verified
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold">Shorta AI - Free Trial</h1>
          </div>
          <a
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign in for more
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Trial Banner */}
          <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold mb-2">Try Shorta AI Free</h2>
                <p className="text-gray-300 text-sm mb-3">
                  Get 1 free analysis without signing up. See how viral YouTube Shorts are structured
                  with AI-powered beat-by-beat breakdowns.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Full video analysis with retention insights</li>
                  <li>✓ Beat-by-beat breakdown</li>
                  <li>✓ Share your analysis</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    Want unlimited analyses and premium features?{' '}
                    <a href="/pricing" className="text-orange-400 hover:text-orange-300">
                      Upgrade to Pro
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">Analyze a YouTube Short</h3>
            <p className="text-gray-400">
              Enter a YouTube URL or upload a video to get started
            </p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setInputMode("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                inputMode === "url"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              YouTube URL
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                inputMode === "upload"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </button>
          </div>

          {/* URL Input */}
          {inputMode === "url" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium mb-2">
                  YouTube URL
                </label>
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/shorts/..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>

              {/* CAPTCHA */}
              {showCaptcha && !turnstileToken && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-sm text-gray-400 mb-4">Complete verification to continue</p>
                  <TurnstileWidget
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setShowCaptcha(false);
                      setError(null);
                    }}
                    onError={() => {
                      setError('Verification failed. Please try again.');
                      setTurnstileToken(null);
                    }}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Short
                  </>
                )}
              </button>
            </form>
          )}

          {/* Upload Input */}
          {inputMode === "upload" && (
            <div className="space-y-6">
              {/* CAPTCHA */}
              {showCaptcha && !turnstileToken && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-sm text-gray-400 mb-4">Complete verification to continue</p>
                  <TurnstileWidget
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setShowCaptcha(false);
                      setError(null);
                    }}
                    onError={() => {
                      setError('Verification failed. Please try again.');
                      setTurnstileToken(null);
                    }}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <VideoUpload
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
