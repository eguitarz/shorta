"use client";

import {
  Play,
  ThumbsUp,
  MessageCircle,
  Share2,
  SkipBack,
  Pause,
  SkipForward,
  FileText,
  AlertTriangle,
  CheckCircle,
  Timer,
  Smile,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyzerContent() {
  const initials = "JD";

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
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
            Export PDF
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Re-Analyze
          </Button>
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[480px_1fr] h-full">
          {/* Left Column - Video Preview */}
          <div className="border-r border-gray-800 p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1">Preview</h2>
            </div>

            {/* Video Container */}
            <div className="relative bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl aspect-[9/16] max-h-[600px] mx-auto w-full max-w-[340px] overflow-hidden group">
              {/* Vertical Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium">
                  9:16 Vertical
                </span>
              </div>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                  <Play className="w-10 h-10 ml-1" />
                </button>
              </div>

              {/* Social Actions */}
              <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-10">
                <button className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Creator Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full" />
                  <span className="font-medium">Creator Name</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="text-xs text-gray-500">Uploaded 2h ago</div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <SkipBack className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Pause className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <SkipForward className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis */}
          <div className="p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Hook Analysis</h1>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-gray-400">
                  MODEL V2.4
                </span>
              </div>
              <p className="text-gray-400">
                AI-generated evaluation based on top performing benchmarks.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Hook Strength */}
              <div className="col-span-2 bg-[#141414] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Hook Strength
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-semibold uppercase">
                    Strong
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold">82</span>
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              {/* Hook Type */}
              <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Hook Type
                  </span>
                </div>
                <p className="text-lg font-semibold">Pattern Interrupt</p>
              </div>

              {/* Hook Duration */}
              <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Hook Duration
                  </span>
                </div>
                <p className="text-3xl font-bold">3.2s</p>
              </div>

              {/* Audience Sentiment */}
              <div className="col-span-2 bg-[#141414] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Smile className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Audience Sentiment Prediction
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-semibold">Positive</p>
                  <span className="text-sm text-gray-400">78%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>

            {/* Issues Section */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">What's holding this back?</h3>
              </div>

              <div className="space-y-4">
                {/* Warning Item */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Visual mismatch in first 3 seconds</h4>
                    <p className="text-sm text-gray-400">
                      The spoken hook mentions "speed," but the visual is static. Consider adding a quick zoom or cut at{" "}
                      <span className="text-orange-500 font-mono">0:01</span>.
                    </p>
                  </div>
                </div>

                {/* Check Item */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Pacing slows down after the hook</h4>
                    <p className="text-sm text-gray-400">
                      Retention drop predicted at{" "}
                      <span className="text-orange-500 font-mono">0:05</span>. The explanation phase is too wordy.
                      </p>
                  </div>
                </div>

                {/* Success Item */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Audio quality is pristine</h4>
                    <p className="text-sm text-gray-400">
                      Voice isolation is working perfectly. No background noise detected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript Section */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Hook Transcript
                  </h3>
                </div>
                <button className="text-sm text-orange-500 hover:text-orange-400 font-medium">
                  Edit Script
                </button>
              </div>

              <div className="font-mono text-sm space-y-2">
                <div>
                  <span className="text-orange-500">0:00</span>{" "}
                  <span className="text-gray-300">
                    "Stop scrolling if you want to double your productivity in just 5 minutes."
                  </span>
                </div>
                <div>
                  <span className="text-orange-500">0:03</span>{" "}
                  <span className="text-gray-300">
                    Here represents the transition point...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
