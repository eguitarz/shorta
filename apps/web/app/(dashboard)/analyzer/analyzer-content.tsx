"use client";

import { useState } from "react";
import {
  Play,
  AlertCircle,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AnalyzerContent() {
  const [hookExpanded, setHookExpanded] = useState(false);
  const [structureExpanded, setStructureExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Projects
          </button>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            My New Short
          </button>
          <button className="text-sm text-white font-medium border-b-2 border-orange-500 pb-[22px] -mb-[17px]">
            Analysis
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-500 font-medium">Analysis Complete</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_380px] h-full">
          {/* Left Column - Analysis */}
          <div className="p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Video Analysis</h1>
              </div>
              <p className="text-sm text-gray-400">
                Based on retention data from similar viral shorts.
              </p>
            </div>

            {/* Video and Cards Grid */}
            <div className="grid grid-cols-[240px_1fr] gap-6 mb-8">
              {/* Video Container */}
              <div className="relative rounded-2xl aspect-[9/16] overflow-hidden">
                {/* Video Placeholder */}
                <img
                  src="/video-placeholder.png"
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                    <Play className="w-8 h-8 ml-1" fill="white" />
                  </button>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs">
                  0:00 / 0:15
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col gap-4">
                {/* Overview */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overall Score</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">82</span>
                    <span className="text-lg text-gray-500">/100</span>
                  </div>
                </div>

                {/* Analysis Cards Grid */}
                <div className="grid grid-cols-3 gap-3 items-start">
              {/* Hook Strength Card */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Hook</span>
                  <button
                    onClick={() => setHookExpanded(!hookExpanded)}
                    className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                  >
                    {hookExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold">82</span>
                  <span className="text-sm text-gray-500">/100</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[9px] font-semibold uppercase">Strong</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '82%' }}></div>
                </div>

                {hookExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hook Duration</span>
                        <span className="text-white font-semibold">0:03s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Viral Pattern</span>
                        <span className="text-gray-300 font-semibold">78/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Loop Strength</span>
                        <span className="text-gray-300 font-semibold">85/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Strong pattern interrupt at 0:00s creates immediate curiosity, but viral alignment could improve by using trending audio format (+15% est. boost).
                    </p>
                  </div>
                )}
              </div>

              {/* Structure Card */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Structure</span>
                  <button
                    onClick={() => setStructureExpanded(!structureExpanded)}
                    className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                  >
                    {structureExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold">76</span>
                  <span className="text-sm text-gray-500">/100</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-semibold uppercase">Well-Paced</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '76%' }}></div>
                </div>

                {structureExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Video Length</span>
                        <span className="text-white font-semibold">0:47s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pacing Consistency</span>
                        <span className="text-gray-300 font-semibold">81/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payoff Timing</span>
                        <span className="text-gray-300 font-semibold">72/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Strong build-up with clear tension arc, but payoff comes 4s too late at 0:12s. Move key reveal to 0:08s to prevent drop-off (-12% est. retention loss).
                    </p>
                  </div>
                )}
              </div>

              {/* Content Card */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Content</span>
                  <button
                    onClick={() => setContentExpanded(!contentExpanded)}
                    className="ml-auto p-0.5 hover:bg-gray-800 rounded transition-colors"
                  >
                    {contentExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold">88</span>
                  <span className="text-sm text-gray-500">/100</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-semibold uppercase">High Value</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '88%' }}></div>
                </div>

                {contentExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Content Type</span>
                        <span className="text-white font-semibold">Educational</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Value Clarity</span>
                        <span className="text-gray-300 font-semibold">92/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Uniqueness</span>
                        <span className="text-gray-300 font-semibold">85/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Clear educational value with unique perspective. Add surprising stat at 0:05s for +18% shareability boost.
                    </p>
                  </div>
                )}
              </div>
                </div>
              </div>
            </div>

            {/* Beat-by-Beat Breakdown */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">🎬 Beat-by-Beat Breakdown</h3>
                <span className="text-sm text-gray-500">4 beats • 2 issues found</span>
              </div>

              <div className="space-y-4">
                {/* Beat 1 - Hook (Good) */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-semibold">Beat 1</span>
                        <span className="text-xs font-mono text-gray-500">0:00 - 0:03s</span>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-semibold">
                          ⚡ HOOK
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-3">Opening Hook</h4>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Transcript</div>
                          <p className="text-sm text-gray-300">"Make decisions based on what feels right, not what looks right."</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Visual</div>
                          <p className="text-sm text-gray-300">Medium close-up, direct eye contact with camera. Subject centered in frame with clean background. Strong lighting on face creates professional, trustworthy aesthetic.</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Audio</div>
                          <p className="text-sm text-gray-300">Clear vocal delivery with confident tone. No background music. Minimal ambient noise.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Retention</div>
                    <div className="text-sm font-semibold text-white">
                      Minimal drop
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-400">Perfect opening - maintain this energy and directness throughout.</p>
                  </div>
                </div>

                {/* Beat 2 - Context (Warning) */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-semibold">Beat 2</span>
                        <span className="text-xs font-mono text-gray-500">0:03 - 0:07s</span>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-semibold">
                          📊 CONTEXT
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-3">Building Context</h4>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Transcript</div>
                          <p className="text-sm text-gray-300">"Most people get stuck trying to make the perfect choice. But here's what nobody tells you..."</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Visual</div>
                          <p className="text-sm text-gray-300">Same medium close-up shot, minimal movement. Camera locked on tripod. Subject maintains eye contact but energy slightly decreases during setup.</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Audio</div>
                          <p className="text-sm text-gray-300">Voice pacing slows during explanation. No music or sound effects to punctuate the setup.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Retention</div>
                    <div className="text-sm font-semibold text-white">
                      Moderate drop
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">Speed up by 1.2x to reduce 14% drop during setup phase.</p>
                      <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded transition-colors">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>

                {/* Beat 3 - Explanation (Critical) */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-semibold">Beat 3</span>
                        <span className="text-xs font-mono text-gray-500">0:07 - 0:12s</span>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-semibold">
                          💡 EXPLANATION
                        </span>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-semibold">
                          CRITICAL
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-3">Core Explanation</h4>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Transcript</div>
                          <p className="text-sm text-gray-300">"There's actually a formula for this. You take your gut feeling, multiply it by the data you have, and subtract the fear of being wrong. Simple math."</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Visual</div>
                          <p className="text-sm text-gray-300">Static talking head shot continues for full 5 seconds. No cut, no visual variety. Subject gestures with hands but frame stays locked. Background remains unchanged.</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Audio</div>
                          <p className="text-sm text-gray-300">Vocal delivery becomes more explanatory, slower pace. Still no music or sound design to maintain engagement during dense content.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Retention</div>
                    <div className="text-sm font-semibold text-white">
                      Major drop
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">Major drop! Add B-roll footage or animated text overlay at 0:09s to re-engage viewers.</p>
                      <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded transition-colors">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>

                {/* Beat 4 - CTA (Good) */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-semibold">Beat 4</span>
                        <span className="text-xs font-mono text-gray-500">0:12 - 0:15s</span>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-semibold">
                          📢 CTA
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-3">Call-to-Action</h4>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Transcript</div>
                          <p className="text-sm text-gray-300">"Try it next time you're stuck. You'll be surprised how simple it actually is."</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Visual</div>
                          <p className="text-sm text-gray-300">Subject leans slightly forward toward camera, creating intimacy. Subtle hand gesture emphasizes "try it." Eye contact intensifies. Slight smile suggests confidence and approachability.</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Audio</div>
                          <p className="text-sm text-gray-300">Voice pace quickens slightly with renewed energy. Tone shifts from explanatory to encouraging. Natural emphasis on action words creates momentum.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Retention</div>
                    <div className="text-sm font-semibold text-white">
                      Slight gain
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-400">Strong ending with clear next step. Retention bounce shows effective CTA.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Re-hook Variants */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-semibold">Re-hook Variants</h3>
                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-semibold uppercase">
                  AI Suggested
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Variant A */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Variant A</span>
                    <span className="text-xs text-green-500 font-semibold">+15% Retention Est.</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">"Stop Scrolling if you want X"</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Direct call-to-action that pre-qualifies the viewer immediately. Best for educational content.
                  </p>
                  <button className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Variant A
                  </button>
                </div>

                {/* Variant B */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Variant B</span>
                    <span className="text-xs text-green-500 font-semibold">+8% Retention Est.</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">"Here is the secret to..."</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Curiosity gap opening. Creates immediate intrigue but requires a strong payoff within 3 seconds.
                  </p>
                  <button className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Variant B
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Approved Changes */}
          <div className="border-l border-gray-800 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Approved Changes</h3>
              <span className="w-7 h-7 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                0
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-2">No changes approved yet</p>
              <p className="text-xs text-gray-600 max-w-[240px]">
                Review suggestions in the Analysis panel and approve actions to add them here.
              </p>
            </div>

            {/* Generate Button */}
            <div className="mt-auto">
              <div className="mb-3 text-xs text-gray-500 text-center">
                Est. Processing Time: <span className="text-white">~45s</span>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                <Zap className="w-4 h-4" fill="currentColor" />
                Generate using approved changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
