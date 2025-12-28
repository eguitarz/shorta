"use client";

import { useState } from "react";
import { Loader2, Sparkles, Link as LinkIcon } from "lucide-react";

export default function CreateAnalysisPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState<{
    format: string;
    confidence: number;
    evidence: string[];
    fallback: {
      format: string;
      confidence: number;
    };
  } | null>(null);

  const [lintResult, setLintResult] = useState<{
    format: string;
    totalRules: number;
    violations: any[];
    passed: number;
    warnings: number;
    errors: number;
    score: number;
    summary: string;
  } | null>(null);

  const [analysis, setAnalysis] = useState<{
    content: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  } | null>(null);

  const [loadingStage, setLoadingStage] = useState<'classifying' | 'analyzing' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setClassification(null);
    setLintResult(null);
    setAnalysis(null);
    setLoadingStage('classifying');

    try {
      // Step 1: Classify video (creates cache)
      const classifyResponse = await fetch("/api/classify-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const classifyData = await classifyResponse.json();

      if (!classifyResponse.ok) {
        throw new Error(classifyData.error || "Failed to classify video");
      }

      // Show classification results immediately
      setClassification(classifyData.classification);
      setLoadingStage('analyzing');

      // Step 2 & 3: Run lint and analyze in parallel
      const [lintResponse, analyzeResponse] = await Promise.all([
        fetch("/api/lint-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
            format: classifyData.classification.format,
          }),
        }),
        fetch("/api/analyze-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        }),
      ]);

      const [lintData, analyzeData] = await Promise.all([
        lintResponse.json(),
        analyzeResponse.json(),
      ]);

      if (!lintResponse.ok) {
        throw new Error(lintData.error || "Failed to lint video");
      }

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || "Failed to analyze video");
      }

      setLintResult(lintData.lintResult);
      setAnalysis({
        content: analyzeData.analysis,
        usage: analyzeData.usage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingStage(null);
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
                    {loadingStage === 'classifying' ? 'Classifying format...' : 'Analyzing video...'}
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
          {(classification || lintResult || analysis) && (
            <div className="space-y-6">
              {/* Classification Results */}
              {classification && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-semibold">Video Classification</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Format Badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">Format:</span>
                      <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg font-semibold uppercase text-sm">
                        {classification.format.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-400">
                        {Math.round(classification.confidence * 100)}% confidence
                      </span>
                    </div>

                    {/* Confidence Bar */}
                    <div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${classification.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Evidence */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Evidence
                      </div>
                      <ul className="space-y-1">
                        {classification.evidence.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Fallback */}
                    {classification.fallback.confidence > 0 && (
                      <div className="pt-3 border-t border-gray-800">
                        <div className="text-xs text-gray-500">
                          Fallback: {classification.fallback.format.replace('_', ' ')} (
                          {Math.round(classification.fallback.confidence * 100)}%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lint Results */}
              {lintResult && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      <h2 className="text-xl font-semibold">Lint Results</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">{lintResult.score}</span>
                      <span className="text-sm text-gray-400">/100</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${lintResult.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-black/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Total Rules</div>
                      <div className="text-2xl font-bold">{lintResult.totalRules}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3">
                      <div className="text-xs text-green-500 mb-1">Passed</div>
                      <div className="text-2xl font-bold text-green-500">{lintResult.passed}</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3">
                      <div className="text-xs text-yellow-500 mb-1">Warnings</div>
                      <div className="text-2xl font-bold text-yellow-500">{lintResult.warnings}</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3">
                      <div className="text-xs text-red-500 mb-1">Errors</div>
                      <div className="text-2xl font-bold text-red-500">{lintResult.errors}</div>
                    </div>
                  </div>

                  {lintResult.violations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Violations</h3>
                      {lintResult.violations.map((violation, idx) => (
                        <div key={idx} className={`border-l-4 p-4 rounded-r-lg ${
                          violation.severity === 'error' ? 'border-red-500 bg-red-500/5' :
                          violation.severity === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
                          'border-blue-500 bg-blue-500/5'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-white">{violation.ruleName}</div>
                              <div className="text-xs text-gray-500 mt-1">{violation.ruleId} • {violation.category}</div>
                            </div>
                            {violation.timestamp && (
                              <span className="text-xs px-2 py-1 bg-gray-800 rounded">{violation.timestamp}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{violation.message}</p>
                          {violation.suggestion && (
                            <div className="text-sm text-gray-400 bg-black/30 rounded p-2 mt-2">
                              <span className="font-semibold">💡 Suggestion:</span> {violation.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400">{lintResult.summary}</p>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {analysis && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-semibold">Analysis Results</h2>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {analysis.content}
                    </div>
                  </div>

                  {analysis.usage && (
                    <div className="mt-6 pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Tokens used: {analysis.usage.totalTokens}</span>
                        <span>•</span>
                        <span>Prompt: {analysis.usage.promptTokens}</span>
                        <span>•</span>
                        <span>Response: {analysis.usage.completionTokens}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
