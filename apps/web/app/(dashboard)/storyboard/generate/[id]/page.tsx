"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Pencil, Lightbulb, ArrowLeft, Sparkles, X, Send, Check, ChevronDown, ChevronUp } from "lucide-react";

interface GeneratedBeat {
  beatNumber: number;
  startTime: number;
  endTime: number;
  type: string;
  title: string;
  directorNotes: string | string[];
  script: string;
  visual: string;
  audio: string;
}

interface GeneratedData {
  overview: {
    title: string;
    contentType: string;
    nicheCategory: string;
    targetAudience: string;
    length: number;
  };
  beats: GeneratedBeat[];
  generatedAt: string;
}

interface EditMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProposedChanges {
  directorNotes?: string;
  script?: string;
  visual?: string;
  audio?: string;
}

export default function StoryboardResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [storyboardData, setStoryboardData] = useState<GeneratedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingBeatNumber, setEditingBeatNumber] = useState<number | null>(null);
  const [editMessages, setEditMessages] = useState<EditMessage[]>([]);
  const [collapsedBeats, setCollapsedBeats] = useState<Set<number>>(new Set());
  const [editInput, setEditInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [proposedChanges, setProposedChanges] = useState<ProposedChanges | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = params.id as string;
    const stored = sessionStorage.getItem(`created_${id}`);

    if (!stored) {
      router.push("/storyboard/create");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setStoryboardData(parsed);
      setLoading(false);
    } catch (err) {
      console.error("Error loading storyboard data:", err);
      setError("Failed to load storyboard");
      setLoading(false);
    }
  }, [params.id, router]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [editMessages]);

  const handleEditBeat = (beatNumber: number) => {
    setEditingBeatNumber(beatNumber);
    setEditMessages([
      {
        role: "assistant",
        content: `I'll help you refine Beat ${beatNumber}. What would you like to change?`,
      },
    ]);
    setProposedChanges(null);
  };

  const handleCloseEdit = () => {
    setEditingBeatNumber(null);
    setEditMessages([]);
    setEditInput("");
    setProposedChanges(null);
  };

  const handleSendEdit = async () => {
    if (!editInput.trim() || !editingBeatNumber || !storyboardData) return;

    const userMessage: EditMessage = { role: "user", content: editInput };
    setEditMessages((prev) => [...prev, userMessage]);
    setEditInput("");
    setIsEditing(true);

    try {
      const editingBeat = storyboardData.beats.find(b => b.beatNumber === editingBeatNumber);

      const response = await fetch("/api/edit-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboard: storyboardData,
          beatNumber: editingBeatNumber,
          currentBeat: editingBeat,
          messages: [...editMessages, userMessage],
        }),
      });

      if (!response.ok) throw new Error("Failed to edit beat");

      const data = await response.json();

      setEditMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.proposedChanges) {
        setProposedChanges(data.proposedChanges);
      }
    } catch (error) {
      console.error("Edit error:", error);
      setEditMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleApplyChanges = () => {
    if (!proposedChanges || !editingBeatNumber || !storyboardData) return;

    const updatedBeats = storyboardData.beats.map(beat =>
      beat.beatNumber === editingBeatNumber
        ? { ...beat, ...proposedChanges }
        : beat
    );

    const updatedData = {
      ...storyboardData,
      beats: updatedBeats,
    };

    setStoryboardData(updatedData);

    // Update sessionStorage
    const id = params.id as string;
    sessionStorage.setItem(`created_${id}`, JSON.stringify(updatedData));

    // Close edit panel
    handleCloseEdit();
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

  const handleQuickAction = (action: string) => {
    const actionTexts: Record<string, string> = {
      shorter: "Make this beat shorter and more concise",
      longer: "Add more detail to this beat",
      simplify: "Simplify the language and make it easier to understand",
      energize: "Make this beat more energetic and exciting",
    };

    setEditInput(actionTexts[action] || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading storyboard...</p>
        </div>
      </div>
    );
  }

  if (error || !storyboardData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Failed to load data"}</p>
          <button
            onClick={() => router.push("/storyboard/create")}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Back to Create
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-black text-white">
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${editingBeatNumber ? 'mr-96' : ''}`}>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Your Storyboard</h1>
                    <p className="text-sm text-gray-400 mt-1">
                      Director&apos;s guide for shooting your video
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Video Overview */}
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-800/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Video Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Title</p>
                <p className="font-medium">{storyboardData.overview.title}</p>
              </div>
              <div>
                <p className="text-gray-400">Format</p>
                <p className="font-medium">{storyboardData.overview.contentType}</p>
              </div>
              <div>
                <p className="text-gray-400">Niche</p>
                <p className="font-medium">{storyboardData.overview.nicheCategory}</p>
              </div>
              <div>
                <p className="text-gray-400">Length</p>
                <p className="font-medium">{storyboardData.overview.length}s</p>
              </div>
            </div>
          </div>

          {/* Generated Storyboard */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Director&apos;s Shot List</h2>

            {storyboardData.beats.map((beat) => (
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
                    <button
                      onClick={() => handleEditBeat(beat.beatNumber)}
                      className="p-2 hover:bg-purple-800/30 rounded-lg transition-colors"
                      title="Edit this beat"
                    >
                      <Pencil className="w-5 h-5 text-purple-400" />
                    </button>
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
                        <span className="text-xs text-gray-500">(shooting guidance)</span>
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

      {/* Edit Panel - Fixed Right Side */}
      {editingBeatNumber && (
        <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-800 flex flex-col z-20">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Edit Beat {editingBeatNumber}</h3>
              <p className="text-sm text-gray-400">Refine this beat with AI</p>
            </div>
            <button
              onClick={handleCloseEdit}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction("shorter")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Make Shorter
              </button>
              <button
                onClick={() => handleQuickAction("longer")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Add Detail
              </button>
              <button
                onClick={() => handleQuickAction("simplify")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Simplify
              </button>
              <button
                onClick={() => handleQuickAction("energize")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Energize
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {editMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}

            {isEditing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Preview Changes */}
          {proposedChanges && (
            <div className="p-4 border-t border-gray-800 bg-gray-800/50">
              <div className="mb-3">
                <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  PROPOSED CHANGES
                </p>
                <div className="text-sm space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(proposedChanges).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-gray-400 capitalize font-medium block">{key}:</span>
                      <p className="text-gray-200 pl-2 whitespace-pre-wrap break-words">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyChanges}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={() => setProposedChanges(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendEdit()}
                placeholder="Describe the changes you want..."
                disabled={isEditing}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 disabled:opacity-50"
              />
              <button
                onClick={handleSendEdit}
                disabled={!editInput.trim() || isEditing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
