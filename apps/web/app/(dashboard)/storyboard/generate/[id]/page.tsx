"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Pencil, Lightbulb, ArrowLeft, Sparkles, X, Send, Check, ChevronDown, ChevronUp, Camera, Move, Film, Type, Video, Zap, Trash2, Copy, ArrowUp, ArrowDown, Plus, RefreshCw, ImageIcon, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import type { BeatImageMap, ReferenceImage } from "@/lib/image-generation/types";
import { ExportDropdown } from "@/components/ExportDropdown";
import { HookVariantSelector, type HookVariant } from "@/components/HookVariantSelector";
import { TechnicalBadge } from "@/components/TechnicalBadge";
import { useTranslations, useLocale } from "next-intl";

interface TextOverlay {
  text: string;
  position: 'top' | 'center' | 'bottom' | 'lower-third';
  timing: string;
}

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
  // Enhanced fields
  shotType?: string;
  cameraMovement?: string;
  transition?: string;
  textOverlays?: TextOverlay[];
  bRollSuggestions?: string[];
  retentionTip?: string;
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
  hookVariants?: HookVariant[];
  selectedHookId?: string;
  generatedAt: string;
  inputInsights?: {
    viralPatterns?: {
      hookPatterns: string[];
      structurePatterns: string[];
      commonElements: string[];
      averageViews: number;
      videosAnalyzed: number;
    } | null;
    libraryInsights?: {
      recommendedHookStyle?: string;
      referenceVideoTitle?: string;
      referenceHookText?: string;
      insightSummary?: string;
    } | null;
  };
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
  const t = useTranslations('storyboard.resultPage');
  const tBeats = useTranslations('storyboard.beats');
  const tFields = useTranslations('storyboard.fields');
  const locale = useLocale();
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

  // Regenerate and highlight state
  const [regeneratingBeat, setRegeneratingBeat] = useState<number | null>(null);
  const [highlightedBeatNumber, setHighlightedBeatNumber] = useState<number | null>(null);

  // Image generation state
  const [beatImages, setBeatImages] = useState<BeatImageMap>({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatingImageBeats, setGeneratingImageBeats] = useState<Set<number>>(new Set());
  const [imagesCompleted, setImagesCompleted] = useState(0);
  const [regeneratingImageBeat, setRegeneratingImageBeat] = useState<number | null>(null);
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const beatRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const loadStoryboard = async () => {
      const id = params.id as string;

      // First try sessionStorage for fast initial load
      const stored = sessionStorage.getItem(`created_${id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStoryboardData(parsed);
          setLoading(false);

          // Still fetch from DB to hydrate beat images
          const response = await fetch(`/api/storyboards/generated/${id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.beatImages && Object.keys(data.beatImages).length > 0) {
              setBeatImages(data.beatImages);
            }
          }
          return;
        } catch (err) {
          console.error("Error parsing sessionStorage data:", err);
        }
      }

      // If not in sessionStorage, fetch from database
      try {
        const response = await fetch(`/api/storyboards/generated/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/storyboard/create");
            return;
          }
          throw new Error("Failed to fetch storyboard");
        }

        const data = await response.json();

        // Transform API response to match expected format
        const transformedData: GeneratedData = {
          overview: data.generated?.overview || data.original?.overview || {
            title: data.title || "Untitled",
            contentType: data.contentType || "",
            nicheCategory: data.nicheCategory || "",
            targetAudience: "",
            length: 0,
          },
          beats: data.generated?.beats || data.original?.beats || [],
          hookVariants: data.hookVariants || [],
          selectedHookId: data.selectedHookId,
          generatedAt: data.generatedAt || new Date().toISOString(),
        };

        setStoryboardData(transformedData);

        // Hydrate beat images from database
        if (data.beatImages && Object.keys(data.beatImages).length > 0) {
          setBeatImages(data.beatImages);
        }

        // Cache in sessionStorage for faster access
        sessionStorage.setItem(`created_${id}`, JSON.stringify(transformedData));
        setLoading(false);
      } catch (err) {
        console.error("Error loading storyboard:", err);
        setError("Failed to load storyboard");
        setLoading(false);
      }
    };

    loadStoryboard();
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
        content: t('editPanel.welcomeMessage', { beatNumber }),
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

      if (!editingBeat) {
        throw new Error(`Beat ${editingBeatNumber} not found. Please try closing and re-opening the edit panel.`);
      }

      const response = await fetch("/api/edit-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboard: storyboardData,
          beatNumber: editingBeatNumber,
          currentBeat: editingBeat,
          messages: [...editMessages, userMessage],
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to edit beat");
      }

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
          content: t('editPanel.error'),
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
    const actionKey = action === "shorter" ? "shorter" : action === "longer" ? "longer" : action === "simplify" ? "simplify" : "energize";
    setEditInput(t(`editPanel.quickActionPrompts.${actionKey}`));
  };

  const handleHookSelect = (variant: HookVariant) => {
    if (!storyboardData) return;

    // Find the hook beat (beat 1)
    const hookBeatIndex = storyboardData.beats.findIndex(b => b.beatNumber === 1);
    if (hookBeatIndex === -1) return;

    // Update beat 1 with the selected variant
    const updatedBeats = [...storyboardData.beats];
    updatedBeats[hookBeatIndex] = {
      ...updatedBeats[hookBeatIndex],
      script: variant.script,
      visual: variant.visual,
      audio: variant.audio,
      directorNotes: variant.directorNotes,
    };

    const updatedData = {
      ...storyboardData,
      beats: updatedBeats,
      selectedHookId: variant.id,
    };

    setStoryboardData(updatedData);

    // Update sessionStorage
    const id = params.id as string;
    sessionStorage.setItem(`created_${id}`, JSON.stringify(updatedData));
  };

  // Helper to recalculate beat times proportionally
  const recalculateBeatTimes = (beats: GeneratedBeat[], totalLength: number): GeneratedBeat[] => {
    const beatCount = beats.length;
    if (beatCount === 0) return beats;

    const avgDuration = totalLength / beatCount;
    let currentTime = 0;

    return beats.map((beat, index) => {
      const startTime = Math.round(currentTime);
      const endTime = index === beatCount - 1
        ? totalLength
        : Math.round(currentTime + avgDuration);
      currentTime = endTime;

      return {
        ...beat,
        beatNumber: index + 1,
        startTime,
        endTime,
      };
    });
  };

  // Save updated data to state and storage
  const saveStoryboardData = (updatedData: GeneratedData) => {
    setStoryboardData(updatedData);
    const id = params.id as string;
    sessionStorage.setItem(`created_${id}`, JSON.stringify(updatedData));
  };

  // Delete a beat
  const handleDeleteBeat = (beatNumber: number) => {
    if (!storyboardData || storyboardData.beats.length <= 1) return;

    const updatedBeats = storyboardData.beats
      .filter(b => b.beatNumber !== beatNumber);

    const reorderedBeats = recalculateBeatTimes(updatedBeats, storyboardData.overview.length);

    saveStoryboardData({
      ...storyboardData,
      beats: reorderedBeats,
    });
  };

  // Duplicate a beat
  const handleDuplicateBeat = (beatNumber: number) => {
    if (!storyboardData) return;

    const beatIndex = storyboardData.beats.findIndex(b => b.beatNumber === beatNumber);
    if (beatIndex === -1) return;

    const beatToDuplicate = storyboardData.beats[beatIndex];
    const newBeat: GeneratedBeat = {
      ...beatToDuplicate,
      title: `${beatToDuplicate.title} (${tBeats('copySuffix')})`,
    };

    const updatedBeats = [
      ...storyboardData.beats.slice(0, beatIndex + 1),
      newBeat,
      ...storyboardData.beats.slice(beatIndex + 1),
    ];

    const reorderedBeats = recalculateBeatTimes(updatedBeats, storyboardData.overview.length);

    saveStoryboardData({
      ...storyboardData,
      beats: reorderedBeats,
    });

    // Scroll to and highlight the new beat (beatIndex + 2 because beatNumber is 1-indexed)
    scrollToBeat(beatIndex + 2);
  };

  // Move beat up
  const handleMoveBeatUp = (beatNumber: number) => {
    if (!storyboardData) return;

    const beatIndex = storyboardData.beats.findIndex(b => b.beatNumber === beatNumber);
    if (beatIndex <= 0) return;

    const updatedBeats = [...storyboardData.beats];
    [updatedBeats[beatIndex - 1], updatedBeats[beatIndex]] =
      [updatedBeats[beatIndex], updatedBeats[beatIndex - 1]];

    const reorderedBeats = recalculateBeatTimes(updatedBeats, storyboardData.overview.length);

    saveStoryboardData({
      ...storyboardData,
      beats: reorderedBeats,
    });
  };

  // Move beat down
  const handleMoveBeatDown = (beatNumber: number) => {
    if (!storyboardData) return;

    const beatIndex = storyboardData.beats.findIndex(b => b.beatNumber === beatNumber);
    if (beatIndex === -1 || beatIndex >= storyboardData.beats.length - 1) return;

    const updatedBeats = [...storyboardData.beats];
    [updatedBeats[beatIndex], updatedBeats[beatIndex + 1]] =
      [updatedBeats[beatIndex + 1], updatedBeats[beatIndex]];

    const reorderedBeats = recalculateBeatTimes(updatedBeats, storyboardData.overview.length);

    saveStoryboardData({
      ...storyboardData,
      beats: reorderedBeats,
    });
  };

  // Insert a new beat after a specific position
  const handleInsertBeat = (afterBeatNumber: number) => {
    if (!storyboardData) return;

    const beatIndex = storyboardData.beats.findIndex(b => b.beatNumber === afterBeatNumber);
    if (beatIndex === -1) return;

    const newBeat: GeneratedBeat = {
      beatNumber: 0, // Will be recalculated
      startTime: 0,
      endTime: 0,
      type: 'main_content',
      title: tBeats('newBeatTitle'),
      directorNotes: tBeats('newBeatNotes'),
      script: tBeats('newBeatScript'),
      visual: tBeats('newBeatVisual'),
      audio: tBeats('newBeatAudio'),
      shotType: 'MS',
      cameraMovement: 'static',
      transition: 'cut',
    };

    const updatedBeats = [
      ...storyboardData.beats.slice(0, beatIndex + 1),
      newBeat,
      ...storyboardData.beats.slice(beatIndex + 1),
    ];

    const reorderedBeats = recalculateBeatTimes(updatedBeats, storyboardData.overview.length);

    saveStoryboardData({
      ...storyboardData,
      beats: reorderedBeats,
    });

    // Open edit panel for the new beat
    handleEditBeat(beatIndex + 2); // +2 because beatNumber is 1-indexed and we inserted after
  };

  // Regenerate a single beat
  const handleRegenerateBeat = async (beatNumber: number) => {
    if (!storyboardData || regeneratingBeat !== null) return;

    setRegeneratingBeat(beatNumber);

    try {
      const response = await fetch("/api/regenerate-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboard: storyboardData,
          beatNumber,
          locale,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate beat");

      const data = await response.json();

      // Update the beat in the storyboard
      const updatedBeats = storyboardData.beats.map(beat =>
        beat.beatNumber === beatNumber ? data.beat : beat
      );

      const updatedData = {
        ...storyboardData,
        beats: updatedBeats,
      };

      saveStoryboardData(updatedData);

      // Highlight the regenerated beat briefly
      setHighlightedBeatNumber(beatNumber);
      setTimeout(() => setHighlightedBeatNumber(null), 2000);
    } catch (error) {
      console.error("Regenerate beat error:", error);
    } finally {
      setRegeneratingBeat(null);
    }
  };

  // Reference image upload handler
  const handleReferenceImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('imageGeneration.referenceInvalidType'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('imageGeneration.referenceTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setReferenceImage({
        mimeType: file.type,
        data: base64,
        name: file.name,
      });
      setReferencePreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    setReferencePreviewUrl(null);
  };

  // Generate images for all beats
  const handleGenerateAllImages = async () => {
    if (!storyboardData || isGeneratingImages) return;

    setIsGeneratingImages(true);
    setImagesCompleted(0);
    setBeatImages({}); // Clear old images so user sees fresh loading state

    const beats = storyboardData.beats;
    const allBeats = new Set(beats.map(b => b.beatNumber));
    setGeneratingImageBeats(allBeats);

    try {
      const response = await fetch("/api/storyboard-images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId: params.id,
          overview: storyboardData.overview,
          beats: beats.map(b => ({
            beatNumber: b.beatNumber,
            title: b.title,
            type: b.type,
            visual: b.visual,
            script: b.script,
            directorNotes: b.directorNotes,
            shotType: b.shotType,
            cameraMovement: b.cameraMovement,
            bRollSuggestions: b.bRollSuggestions,
          })),
          referenceImage: referenceImage || undefined,
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error(t('imageGeneration.noCredits'));
        } else {
          toast.error(errorData.error || t('imageGeneration.failed'));
        }
        return;
      }

      const data = await response.json();

      // Update state with generated images (fresh map, not merging old)
      const newBeatImages: BeatImageMap = {};
      for (const result of data.images) {
        newBeatImages[result.beatNumber.toString()] = {
          url: result.imageUrl,
          storagePath: '',
          prompt: result.prompt,
          generatedAt: new Date().toISOString(),
        };
      }
      setBeatImages(newBeatImages);
      setImagesCompleted(data.images.length);

      if (data.images.length === beats.length) {
        toast.success(t('imageGeneration.success', { count: data.images.length }));
      } else if (data.images.length > 0) {
        toast.warning(t('imageGeneration.partial', { completed: data.images.length, total: beats.length }));
      } else {
        toast.error(t('imageGeneration.failed'));
      }
    } catch (error) {
      console.error("Generate images error:", error);
      toast.error(t('imageGeneration.failed'));
    } finally {
      setIsGeneratingImages(false);
      setGeneratingImageBeats(new Set());
    }
  };

  // Regenerate image for a single beat
  const handleRegenerateImage = async (beatNumber: number) => {
    if (!storyboardData || regeneratingImageBeat !== null) return;

    setRegeneratingImageBeat(beatNumber);

    const beat = storyboardData.beats.find(b => b.beatNumber === beatNumber);
    if (!beat) return;

    try {
      const response = await fetch("/api/storyboard-images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId: params.id,
          overview: storyboardData.overview,
          beats: [{
            beatNumber: beat.beatNumber,
            title: beat.title,
            type: beat.type,
            visual: beat.visual,
            script: beat.script,
            directorNotes: beat.directorNotes,
            shotType: beat.shotType,
            cameraMovement: beat.cameraMovement,
            bRollSuggestions: beat.bRollSuggestions,
          }],
          referenceImage: referenceImage || undefined,
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || t('imageGeneration.regenerateFailed'));
        return;
      }

      const data = await response.json();
      if (data.images?.length) {
        const result = data.images[0];
        setBeatImages(prev => {
          const updatedImages = {
            ...prev,
            [result.beatNumber.toString()]: {
              url: result.imageUrl,
              storagePath: '',
              prompt: result.prompt,
              generatedAt: new Date().toISOString(),
            },
          };
          return updatedImages;
        });
        toast.success(t('imageGeneration.regenerateSuccess', { beatNumber }));
      }
    } catch (error) {
      console.error("Regenerate image error:", error);
      toast.error(t('imageGeneration.regenerateFailed'));
    } finally {
      setRegeneratingImageBeat(null);
    }
  };

  // Download a beat image
  const handleDownloadImage = async (beatNumber: number) => {
    const imageData = beatImages[beatNumber.toString()];
    if (!imageData?.url) return;

    try {
      const response = await fetch(imageData.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const title = storyboardData?.overview.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_') || 'storyboard';
      link.download = `${title}_beat_${beatNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download image error:', error);
      toast.error('Failed to download image');
    }
  };

  // Scroll to and highlight a beat
  const scrollToBeat = (beatNumber: number) => {
    setTimeout(() => {
      const beatElement = beatRefs.current.get(beatNumber);
      if (beatElement) {
        beatElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedBeatNumber(beatNumber);
        setTimeout(() => setHighlightedBeatNumber(null), 2000);
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !storyboardData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || t('failedToLoad')}</p>
          <button
            onClick={() => router.push("/storyboard/create")}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            {t('backToCreate')}
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
                      <h1 className="text-2xl font-bold">{t('title')}</h1>
                      <p className="text-sm text-gray-400 mt-1">
                        {t('subtitle')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Image Generation Group */}
                  <div className="flex items-center bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                    {/* Reference Image Upload */}
                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleReferenceImageSelect}
                      className="hidden"
                    />
                    {referenceImage ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-700">
                        <img
                          src={referencePreviewUrl!}
                          alt="Reference"
                          className="w-7 h-7 rounded object-cover"
                        />
                        <span className="text-xs text-gray-300 max-w-[80px] truncate">{referenceImage.name}</span>
                        <button
                          onClick={handleRemoveReferenceImage}
                          className="p-0.5 hover:bg-gray-700 rounded transition-colors"
                          title={t('imageGeneration.removeReference')}
                        >
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => referenceInputRef.current?.click()}
                        disabled={isGeneratingImages}
                        className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs border-r border-gray-700"
                        title={t('imageGeneration.addReference')}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('imageGeneration.reference')}</span>
                      </button>
                    )}
                    <button
                      onClick={handleGenerateAllImages}
                      disabled={isGeneratingImages}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isGeneratingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('imageGeneration.generating', { completed: imagesCompleted, total: storyboardData.beats.length })}</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          <span>{t('imageGeneration.generate')}</span>
                          <span className="text-amber-200 text-xs">{storyboardData.beats.length * 10} credits</span>
                        </>
                      )}
                    </button>
                  </div>
                  <ExportDropdown
                    overview={storyboardData.overview}
                    beats={storyboardData.beats}
                    beatImages={beatImages}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Video Overview */}
            <div className="mb-8 p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-800/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                {t('overview.title')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">{t('overview.titleLabel')}</p>
                  <p className="font-medium">{storyboardData.overview.title}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t('overview.format')}</p>
                  <p className="font-medium">{storyboardData.overview.contentType}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t('overview.niche')}</p>
                  <p className="font-medium">{storyboardData.overview.nicheCategory}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t('overview.length')}</p>
                  <p className="font-medium">{storyboardData.overview.length}s</p>
                </div>
              </div>
            </div>

            {/* Insights Used (Collapsible Debug Display) */}
            {storyboardData.inputInsights && (storyboardData.inputInsights.viralPatterns || storyboardData.inputInsights.libraryInsights) && (
              <details className="mb-6 group">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" />
                  <span>Insights used for generation</span>
                  <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                </summary>
                <ul className="mt-2 ml-5 text-xs text-gray-400 space-y-1 list-disc">
                  {storyboardData.inputInsights.libraryInsights?.recommendedHookStyle && (
                    <li><span className="text-purple-400">Library:</span> Hook style "{storyboardData.inputInsights.libraryInsights.recommendedHookStyle}"</li>
                  )}
                  {storyboardData.inputInsights.libraryInsights?.referenceVideoTitle && (
                    <li><span className="text-purple-400">Reference:</span> {storyboardData.inputInsights.libraryInsights.referenceVideoTitle}</li>
                  )}
                  {storyboardData.inputInsights.viralPatterns && (
                    <li><span className="text-orange-400">Viral:</span> {storyboardData.inputInsights.viralPatterns.videosAnalyzed} videos analyzed (avg {storyboardData.inputInsights.viralPatterns.averageViews.toLocaleString()} views)</li>
                  )}
                </ul>
              </details>
            )}
            {/* Hook Variant Selector */}
            {storyboardData.hookVariants && storyboardData.hookVariants.length > 0 && (
              <HookVariantSelector
                variants={storyboardData.hookVariants}
                selectedId={storyboardData.selectedHookId || storyboardData.hookVariants[0]?.id || 'bold'}
                onSelect={handleHookSelect}
              />
            )}

            {/* Generated Storyboard */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t('shotList.title')}</h2>

              {storyboardData.beats.map((beat, index) => (
                <div key={beat.beatNumber} className="space-y-3">
                  <div
                    ref={(el) => {
                      if (el) beatRefs.current.set(beat.beatNumber, el);
                    }}
                    className={`bg-gray-900 rounded-lg border overflow-hidden transition-all duration-500 ${highlightedBeatNumber === beat.beatNumber
                      ? "border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "border-gray-800"
                      }`}
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
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-400">
                                {formatTime(beat.startTime)} - {formatTime(beat.endTime)} • {beat.type}
                              </p>
                              {/* Technical Badges */}
                              {(beat.shotType || beat.cameraMovement || beat.transition) && (
                                <div className="flex items-center gap-1.5 ml-2">
                                  {beat.shotType && (
                                    <TechnicalBadge type="shot" value={beat.shotType} />
                                  )}
                                  {beat.cameraMovement && beat.cameraMovement !== 'static' && (
                                    <TechnicalBadge type="movement" value={beat.cameraMovement} />
                                  )}
                                  {beat.transition && beat.transition !== 'none' && (
                                    <TechnicalBadge type="transition" value={beat.transition} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Beat Actions */}
                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveBeatUp(beat.beatNumber)}
                            disabled={beat.beatNumber === 1}
                            className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={tBeats('moveUp')}
                          >
                            <ArrowUp className="w-4 h-4 text-gray-400" />
                          </button>
                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveBeatDown(beat.beatNumber)}
                            disabled={beat.beatNumber === storyboardData.beats.length}
                            className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={tBeats('moveDown')}
                          >
                            <ArrowDown className="w-4 h-4 text-gray-400" />
                          </button>
                          <div className="w-px h-5 bg-gray-700 mx-1" />
                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicateBeat(beat.beatNumber)}
                            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                            title={tBeats('duplicate')}
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                          {/* Regenerate */}
                          <button
                            onClick={() => handleRegenerateBeat(beat.beatNumber)}
                            disabled={regeneratingBeat !== null}
                            className="p-1.5 hover:bg-green-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={tBeats('regenerate')}
                          >
                            {regeneratingBeat === beat.beatNumber ? (
                              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-green-400" />
                            )}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleEditBeat(beat.beatNumber)}
                            className="p-1.5 hover:bg-purple-800/30 rounded transition-colors"
                            title={tBeats('edit')}
                          >
                            <Pencil className="w-4 h-4 text-purple-400" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteBeat(beat.beatNumber)}
                            disabled={storyboardData.beats.length <= 1}
                            className="p-1.5 hover:bg-red-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={tBeats('delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Beat Content */}
                    <div className="p-6 space-y-6">
                      <div className="flex gap-5">
                        {/* Beat Image - left column */}
                        {beatImages[beat.beatNumber.toString()] && (
                          <div className="relative group flex-shrink-0">
                            <img
                              src={beatImages[beat.beatNumber.toString()].url}
                              alt={`Beat ${beat.beatNumber}: ${beat.title}`}
                              className="w-32 aspect-[9/16] object-cover rounded-lg border border-gray-700"
                            />
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleDownloadImage(beat.beatNumber)}
                                className="p-1 bg-black/70 rounded-md hover:bg-black/90 transition-colors"
                                title={t('imageGeneration.download')}
                              >
                                <Download className="w-3.5 h-3.5 text-gray-300" />
                              </button>
                              <button
                                onClick={() => handleRegenerateImage(beat.beatNumber)}
                                disabled={regeneratingImageBeat === beat.beatNumber}
                                className="p-1 bg-black/70 rounded-md hover:bg-black/90 transition-colors"
                                title={t('imageGeneration.regenerate')}
                              >
                                {regeneratingImageBeat === beat.beatNumber ? (
                                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Image generating placeholder */}
                        {generatingImageBeats.has(beat.beatNumber) && !beatImages[beat.beatNumber.toString()] && (
                          <div className="w-32 aspect-[9/16] bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center flex-shrink-0">
                            <div className="flex flex-col items-center gap-1.5">
                              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                              <span className="text-xs text-gray-400">{t('imageGeneration.generatingBeat')}</span>
                            </div>
                          </div>
                        )}

                        {/* Script + Visual/Audio - right column */}
                        <div className="flex-1 space-y-4 min-w-0">
                          {/* Script - Primary Focus */}
                          <div>
                            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">{t('beatContent.whatToSay')}</h4>
                            <p className="text-lg leading-relaxed text-gray-100 font-medium">{beat.script}</p>
                          </div>

                          {/* Visual & Audio - Concise Bullets */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">{t('beatContent.visual')}</h4>
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
                              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">{t('beatContent.audio')}</h4>
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
                        </div>
                      </div>

                      {/* Enhanced Fields Row */}
                      {(beat.textOverlays?.length || beat.bRollSuggestions?.length || beat.retentionTip) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800/30 rounded-lg">
                          {/* Text Overlays */}
                          {beat.textOverlays && beat.textOverlays.length > 0 && (
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold flex items-center gap-1.5">
                                <Type className="w-3.5 h-3.5" />
                                {t('beatContent.textOverlays')}
                              </h4>
                              <ul className="text-sm space-y-1.5">
                                {beat.textOverlays.map((overlay, idx) => (
                                  <li key={idx} className="text-gray-300">
                                    <span className="font-medium">&ldquo;{overlay.text}&rdquo;</span>
                                    <span className="text-gray-500 text-xs ml-2">
                                      {overlay.position} • {overlay.timing}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* B-Roll Suggestions */}
                          {beat.bRollSuggestions && beat.bRollSuggestions.length > 0 && (
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5" />
                                {t('beatContent.bRollIdeas')}
                              </h4>
                              <ul className="text-sm text-gray-400 space-y-1">
                                {beat.bRollSuggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex gap-2 items-start">
                                    <span className="text-gray-600 flex-shrink-0">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Retention Tip */}
                          {beat.retentionTip && (
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                {t('beatContent.retentionTip')}
                              </h4>
                              <p className="text-sm text-gray-400">{beat.retentionTip}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Director's Notes - Collapsible */}
                      <div className="border-t border-gray-800 pt-4">
                        <button
                          onClick={() => toggleDirectorNotes(beat.beatNumber)}
                          className="w-full flex items-center justify-between text-left group hover:bg-gray-900/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-400" />
                            <h4 className="text-sm font-semibold text-purple-300">{t('beatContent.directorNotes')}</h4>
                            <span className="text-xs text-gray-500">({t('beatContent.shootingGuidance')})</span>
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

                  {/* Insert Beat Button */}
                  {index < storyboardData.beats.length - 1 && (
                    <button
                      onClick={() => handleInsertBeat(beat.beatNumber)}
                      className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-purple-600 hover:text-purple-400 hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2 group"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">{tBeats('insertBeat')}</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Add Beat at End */}
              <button
                onClick={() => handleInsertBeat(storyboardData.beats[storyboardData.beats.length - 1]?.beatNumber || 0)}
                className="w-full py-3 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-purple-600 hover:text-purple-400 hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>{tBeats('add')}</span>
              </button>
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
              <h3 className="font-semibold">{t('editPanel.title')} {editingBeatNumber}</h3>
              <p className="text-sm text-gray-400">{t('editPanel.subtitle')}</p>
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
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{t('editPanel.quickActions')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction("shorter")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('editPanel.makeShorter')}
              </button>
              <button
                onClick={() => handleQuickAction("longer")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('editPanel.addDetail')}
              </button>
              <button
                onClick={() => handleQuickAction("simplify")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('editPanel.simplify')}
              </button>
              <button
                onClick={() => handleQuickAction("energize")}
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('editPanel.energize')}
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
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${msg.role === "user"
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
                <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">{t('editPanel.sending')}</span>
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
                  {t('editPanel.proposedChanges')}
                </p>
                <div className="text-sm space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(proposedChanges).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-gray-400 font-medium block">{tFields(key as any)}:</span>
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
                  {t('editPanel.apply')}
                </button>
                <button
                  onClick={() => setProposedChanges(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t('editPanel.discard')}
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
                placeholder={t('editPanel.placeholder')}
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
