"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles, ArrowLeft, Paperclip, X, FileText, Image as ImageIcon, Film } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReferenceVideoPickerModal, ReferenceVideo } from "@/components/ReferenceVideoPickerModal";

interface FileAttachment {
  mimeType: string;
  data: string;
  name: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
}

interface LibraryInsight {
  recommendedHookStyle?: string;
  referenceVideoTitle?: string;
  referenceHookText?: string;
  insightSummary?: string;
}

interface ExtractedData {
  topic: string;
  format: string;
  targetLength: number;
  keyPoints: string[];
  targetAudience?: string;
  contentType?: string;
  libraryInsights?: LibraryInsight;
}

interface ChatResponse {
  message: string;
  isReady: boolean;
  extractedData?: ExtractedData;
}

interface ViralPatterns {
  hookPatterns: string[];
  structurePatterns: string[];
  commonElements: string[];
  averageViews: number;
  videosAnalyzed: number;
  timestamp: string;
  videos?: Array<{
    title: string;
    views: number;
  }>;
}

export default function CreateStoryboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('storyboard.createPage');
  const tChat = useTranslations('storyboard.chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasAutoSubmittedRef = useRef(false);
  const [viralPatterns, setViralPatterns] = useState<ViralPatterns | null>(null);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [referenceVideo, setReferenceVideo] = useState<ReferenceVideo | null>(null);
  const [isReferencePickerOpen, setIsReferencePickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: t('welcomeMessage'),
      }]);
    }
  }, [t, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-submit topic from query parameter
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true; // Synchronous update prevents double submission
      setInput(topic);
      // Auto-submit after a brief delay to ensure UI is ready
      setTimeout(() => {
        handleSendWithMessage(topic);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Pre-populate reference video from URL params
  useEffect(() => {
    const refId = searchParams.get('refId');
    const refTitle = searchParams.get('refTitle');
    if (refId && refTitle && !referenceVideo) {
      const refScore = searchParams.get('refScore');
      const refNiche = searchParams.get('refNiche');
      const refHook = searchParams.get('refHook');
      setReferenceVideo({
        id: refId,
        title: refTitle,
        score: refScore ? parseInt(refScore, 10) : null,
        niche: refNiche || null,
        hookCategory: refHook || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        alert(t('errors.fileType', { name: file.name }));
        continue;
      }

      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        alert(t('errors.fileSize', { name: file.name }));
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, {
          mimeType: file.type,
          data: base64,
          name: file.name,
        }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithMessage = async (messageText: string, filesToSend?: FileAttachment[]) => {
    const hasFiles = filesToSend && filesToSend.length > 0;
    if ((!messageText.trim() && !hasFiles) || isLoading) return;

    // If only files are attached, add a default message
    const finalMessage = messageText.trim() || (hasFiles ? "Please analyze these files for my video storyboard." : "");

    const userMessage: Message = {
      role: "user",
      content: finalMessage,
      files: hasFiles ? filesToSend : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // Keep attached files - user can remove them manually from the toolbar
    setIsLoading(true);

    try {
      const response = await fetch("/api/storyboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          locale,
          referenceVideoId: referenceVideo?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data: ChatResponse = await response.json();

      console.log('Chat response:', { isReady: data.isReady, hasExtractedData: !!data.extractedData });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      // Always update extracted data if available
      if (data.extractedData) {
        setExtractedData(data.extractedData);
        console.log('Updated extractedData:', data.extractedData);
      }

      // Update ready state
      if (data.isReady) {
        setIsReady(true);
        console.log('Button is now ready!');
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t('errors.chatFailed'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendWithMessage(input, attachedFiles.length > 0 ? attachedFiles : undefined);
  };

  const handleGenerate = async () => {
    // Allow generation even without extracted data (use defaults)
    console.log('Generate clicked with extractedData:', extractedData);

    setIsGenerating(true);

    try {
      let patterns: ViralPatterns | null = null;

      // Step 1: Analyze viral patterns (always enabled)
      if (!viralPatterns) {
        setIsAnalyzingPatterns(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Analyzing recent viral videos in "${extractedData?.topic || 'your niche'}"... (this takes ~10 seconds)`,
          },
        ]);

        try {
          const patternsResponse = await fetch("/api/analyze-viral-patterns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ niche: extractedData?.topic || 'general content' }),
          });

          if (patternsResponse.ok) {
            const { patterns: foundPatterns } = await patternsResponse.json();
            patterns = foundPatterns;
            setViralPatterns(foundPatterns);

            // Show patterns to user
            const patternMessage = `Found ${foundPatterns.videosAnalyzed} viral videos! Here are the winning patterns:

**Hook Patterns:**
${foundPatterns.hookPatterns.map((p: string) => `• ${p}`).join('\n')}

**Content Structure:**
${foundPatterns.structurePatterns.map((p: string) => `• ${p}`).join('\n')}

**Common Elements:**
${foundPatterns.commonElements.map((p: string) => `• ${p}`).join('\n')}

Average views: ${foundPatterns.averageViews.toLocaleString()}

Incorporating these into your storyboard...`;

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: patternMessage,
              },
            ]);
          } else {
            const errorData = await patternsResponse.json().catch(() => ({}));
            console.warn("Pattern analysis failed:", patternsResponse.status, errorData);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Couldn't analyze viral patterns (${patternsResponse.status}: ${errorData.error || 'Unknown error'}). Generating with general best practices...`,
              },
            ]);
          }
        } catch (patternError) {
          console.error("Pattern analysis error:", patternError);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Pattern analysis failed: ${patternError instanceof Error ? patternError.message : 'Unknown error'}. Generating with general best practices...`,
            },
          ]);
        } finally {
          setIsAnalyzingPatterns(false);
        }
      } else if (viralPatterns) {
        // Use cached patterns
        patterns = viralPatterns;
      }

      // Step 2: Generate storyboard with patterns
      const dataToSend = {
        topic: extractedData?.topic || "Untitled Video",
        format: extractedData?.format || "talking_head",
        targetLength: extractedData?.targetLength || 30,
        keyPoints: (extractedData?.keyPoints?.length || 0) > 0 ? extractedData?.keyPoints : ["Main point"],
        targetAudience: extractedData?.targetAudience,
        contentType: extractedData?.contentType || "educational",
        viralPatterns: patterns, // Pass patterns to generation
        libraryInsights: extractedData?.libraryInsights, // Pass library insights from tool calls
      };

      console.log('Sending to generation:', dataToSend);

      const response = await fetch("/api/create-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSend, locale }),
      });

      if (!response.ok) throw new Error("Failed to generate storyboard");

      const data = await response.json();

      // Use the database ID if available, otherwise fall back to timestamp
      const id = data.id || Date.now().toString();

      // Store in sessionStorage for faster access
      sessionStorage.setItem(`created_${id}`, JSON.stringify(data));

      // Navigate to results
      router.push(`/storyboard/generate/${id}`);
    } catch (error) {
      console.error("Generation error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, failed to generate storyboard. Please try again.",
        },
      ]);
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/home")}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('title')}</h1>
                  <p className="text-sm text-gray-400">
                    {t('subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-100"
                  }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                      a: ({ href, children }) => <a href={href} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {!isGenerating && messages.length > 1 && (
            <div className="mb-4">
              {/* Info/Warning Message */}
              {extractedData && isReady && (
                <div className="mb-3 p-2 rounded-lg border text-xs bg-green-900/10 border-green-800/30 text-green-400">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Ready to generate!</span>
                  </div>
                </div>
              )}

              {/* Generate Button - Visible after first user message */}
              <button
                onClick={handleGenerate}
                className={`w-full px-6 py-4 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${isReady
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                  }`}
              >
                <Sparkles className="w-5 h-5" />
                {isReady ? tChat('generate') : t('tryAnyway')}
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-3 text-purple-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('generating')}</span>
              </div>
            </div>
          )}

          {/* Unified Attachments section */}
          <div className="mb-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('attachments.title')}</span>
              <div className="flex items-center gap-3">
                {!referenceVideo && (
                  <button
                    onClick={() => setIsReferencePickerOpen(true)}
                    disabled={isLoading || isGenerating}
                    className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Film className="w-3 h-3" />
                    {t('attachments.addReference')}
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isGenerating}
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Paperclip className="w-3 h-3" />
                  {t('attachments.addFiles')}
                </button>
              </div>
            </div>
            {(referenceVideo || attachedFiles.length > 0) ? (
              <div className="flex flex-wrap gap-2">
                {/* Reference Video chip */}
                {referenceVideo && (
                  <div className="flex items-center gap-2 bg-gray-800 border border-orange-500/30 rounded-lg px-3 py-2">
                    {referenceVideo.thumbnailUrl ? (
                      <img
                        src={referenceVideo.thumbnailUrl}
                        alt={referenceVideo.title}
                        className="w-10 h-7 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-7 rounded bg-gray-700 flex items-center justify-center">
                        <Film className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm text-white max-w-[120px] truncate">{referenceVideo.title}</span>
                      <span className="text-xs text-orange-400">{t('attachments.reference')}</span>
                    </div>
                    <button
                      onClick={() => setReferenceVideo(null)}
                      className="p-0.5 hover:bg-gray-700 rounded ml-1"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                )}
                {/* File chips */}
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {file.mimeType === 'application/pdf' ? (
                      <FileText className="w-4 h-4 text-red-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="max-w-[150px] truncate text-gray-300">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-0.5 hover:bg-gray-700 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 py-2">
                {t('attachments.empty')}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,application/pdf,image/*"
              multiple
              className="hidden"
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={attachedFiles.length > 0 ? t('inputWithFiles') : t('inputPlaceholder')}
              disabled={isLoading || isGenerating}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading || isGenerating}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reference Video Picker Modal */}
      <ReferenceVideoPickerModal
        isOpen={isReferencePickerOpen}
        onClose={() => setIsReferencePickerOpen(false)}
        onSelect={(video) => {
          setReferenceVideo(video);
          setIsReferencePickerOpen(false);
        }}
      />
    </div>
  );
}
