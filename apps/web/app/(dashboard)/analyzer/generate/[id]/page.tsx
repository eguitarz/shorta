"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play, Lightbulb, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface GeneratedBeat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  directorNotes: string;
  script: string;
  visual: string;
  audio: string;
}

interface GeneratedData {
  url: string;
  original: {
    overview: any;
    beats: any[];
  };
  generated: {
    overview: any;
    beats: GeneratedBeat[];
  };
  appliedChanges: any[];
  generatedAt: string;
}

export default function GenerateResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedBeats, setCollapsedBeats] = useState<Set<number>>(new Set());

  useEffect(() => {
    const id = params.id as string;
    const stored = sessionStorage.getItem(`generated_${id}`);

    if (!stored) {
      router.push("/analyzer/create");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setGeneratedData(parsed);
      setLoading(false);
    } catch (err) {
      console.error("Error loading generated data:", err);
      setError("Failed to load generated storyboard");
      setLoading(false);
    }
  }, [params.id, router]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleDirectorNotes = (beatNumber: number) => {
    setCollapsedBeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(beatNumber)) {
        newSet.delete(beatNumber);
      } else {
        newSet.add(beatNumber);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading generated storyboard...</p>
        </div>
      </div>
    );
  }

  if (error || !generatedData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Failed to load data"}</p>
          <button
            onClick={() => router.push("/analyzer/create")}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Back to Analyzer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      <div className="min-h-full pb-20">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Generated Storyboard</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Director&apos;s guide for shooting your video
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {generatedData.appliedChanges.length} change(s) applied
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Overview */}
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Video Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Title</p>
              <p className="font-medium">{generatedData.generated.overview.title}</p>
            </div>
            <div>
              <p className="text-gray-400">Format</p>
              <p className="font-medium">{generatedData.generated.overview.contentType}</p>
            </div>
            <div>
              <p className="text-gray-400">Niche</p>
              <p className="font-medium">{generatedData.generated.overview.nicheCategory}</p>
            </div>
            <div>
              <p className="text-gray-400">Length</p>
              <p className="font-medium">{generatedData.generated.overview.length}s</p>
            </div>
          </div>
        </div>

        {/* Applied Changes Summary */}
        {generatedData.appliedChanges.length > 0 && (
          <div className="mb-8 p-6 bg-purple-900/20 rounded-lg border border-purple-800/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-400" />
              Applied Changes
            </h2>
            <div className="space-y-3">
              {generatedData.appliedChanges.map((change) => (
                <div key={change.id} className="text-sm group relative">
                  {change.type === 'fix' ? (
                    <>
                      <div className="flex gap-2 cursor-help">
                        <span className="text-purple-400 font-medium">Beat {change.beatNumber}:</span>
                        <span className="text-gray-300">{change.issue.suggestion}</span>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute left-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1">Issue:</p>
                            <p className="text-sm text-gray-200">{change.issue.message}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1">Suggestion:</p>
                            <p className="text-sm text-gray-200">{change.issue.suggestion}</p>
                          </div>
                          <div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              change.issue.severity === 'critical' ? 'bg-red-900/50 text-red-300' :
                              change.issue.severity === 'moderate' ? 'bg-orange-900/50 text-orange-300' :
                              'bg-blue-900/50 text-blue-300'
                            }`}>
                              {change.issue.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2 cursor-help">
                        <span className="text-purple-400 font-medium">Re-hook Variant {change.variant.label}:</span>
                        <span className="text-gray-300">Applied to opening</span>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute left-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1">New Hook Text:</p>
                          <p className="text-sm text-gray-200 italic">&quot;{change.variant.text}&quot;</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Storyboard */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Director&apos;s Shot List</h2>

          {generatedData.generated.beats.map((beat, index) => (
            <div
              key={beat.beatNumber}
              className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
            >
              {/* Beat Header */}
              <div className="bg-gradient-to-r from-purple-900/30 to-transparent p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                      {beat.beatNumber}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{beat.title}</h3>
                      <p className="text-sm text-gray-400">
                        {formatTime(beat.startTime)} - {formatTime(beat.endTime)} • {beat.type}
                      </p>
                    </div>
                  </div>
                  <Play className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              {/* Beat Content */}
              <div className="p-6 space-y-6">
                {/* Script - Primary Focus */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">What to Say</h4>
                  <p className="text-lg leading-relaxed text-gray-100 font-medium">{beat.script}</p>
                </div>

                {/* Visual & Audio - Concise Bullets */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Visual</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-none">
                      {(() => {
                        const visual = beat.visual.split('\n').filter(line => line.trim());
                        return visual.map((line, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <span className="text-gray-600 flex-shrink-0">•</span>
                            <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Audio</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-none">
                      {(() => {
                        const audio = beat.audio.split('\n').filter(line => line.trim());
                        return audio.map((line, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <span className="text-gray-600 flex-shrink-0">•</span>
                            <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </div>

                {/* Director's Notes - Collapsible */}
                <div className="border-t border-gray-800 pt-4">
                  <button
                    onClick={() => toggleDirectorNotes(beat.beatNumber)}
                    className="w-full flex items-center justify-between text-left group hover:bg-gray-900/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-semibold text-purple-300">Director&apos;s Notes</h4>
                      <span className="text-xs text-gray-500">(analysis & tips)</span>
                    </div>
                    {collapsedBeats.has(beat.beatNumber) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                    )}
                  </button>
                  {!collapsedBeats.has(beat.beatNumber) && (
                    <ul className="mt-3 text-sm text-gray-400 leading-relaxed space-y-2 list-none pl-6">
                      {(() => {
                        // Handle both string and array formats
                        const notes = Array.isArray(beat.directorNotes)
                          ? beat.directorNotes
                          : (typeof beat.directorNotes === 'string' ? beat.directorNotes.split('\n') : []);

                        return notes.filter(line => line && line.trim()).map((note, idx) => {
                          const noteText = typeof note === 'string' ? note.replace(/^[•\-\*]\s*/, '') : note;
                          // Check if note is highlighted with **text**
                          const isHighlighted = noteText.includes('**');
                          const displayText = noteText.replace(/\*\*/g, '');

                          return (
                            <li key={idx} className="flex gap-2 items-start">
                              <span className={`flex-shrink-0 mt-0.5 ${isHighlighted ? 'text-gray-100/60' : 'text-purple-400/50'}`}>
                                •
                              </span>
                              <span className={`flex-1 ${isHighlighted ? 'text-white/90 font-medium' : ''}`}>
                                {displayText}
                              </span>
                            </li>
                          );
                        });
                      })()}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
