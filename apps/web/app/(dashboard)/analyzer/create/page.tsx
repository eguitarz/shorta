"use client";

import { useState } from "react";
import { Loader2, Sparkles, Link as LinkIcon } from "lucide-react";

export default function CreateAnalysisPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-short", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze URL");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Projects
          </button>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            My New Short
          </button>
          <button className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
            Create Analysis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Short Analysis</h1>
            <p className="text-gray-400">
              Enter a URL to analyze a short-form video or content with AI
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <label className="block mb-3">
                <span className="text-sm text-gray-400 mb-2 block">
                  Short URL
                </span>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/shorts/..."
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Short
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Analysis Results</h2>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {result.summary}
                </div>
              </div>

              {result.usage && (
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Tokens used: {result.usage.totalTokens}</span>
                    <span>•</span>
                    <span>Prompt: {result.usage.promptTokens}</span>
                    <span>•</span>
                    <span>Response: {result.usage.completionTokens}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
