"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles, ArrowLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedData {
  topic: string;
  format: string;
  targetLength: number;
  keyPoints: string[];
  targetAudience?: string;
  contentType?: string;
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
}

export default function CreateStoryboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you create a video storyboard. What kind of video do you want to make?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [viralPatterns, setViralPatterns] = useState<ViralPatterns | null>(null);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-submit topic from query parameter
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && !hasAutoSubmitted) {
      setHasAutoSubmitted(true);
      setInput(topic);
      // Auto-submit after a brief delay to ensure UI is ready
      setTimeout(() => {
        handleSendWithMessage(topic);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hasAutoSubmitted]);

  const handleSendWithMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/storyboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
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
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendWithMessage(input);
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
        keyPoints: extractedData?.keyPoints?.length > 0 ? extractedData.keyPoints : ["Main point"],
        targetAudience: extractedData?.targetAudience,
        contentType: extractedData?.contentType || "educational",
        viralPatterns: patterns, // Pass patterns to generation
      };

      console.log('Sending to generation:', dataToSend);

      const response = await fetch("/api/create-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error("Failed to generate storyboard");

      const data = await response.json();

      // Store in sessionStorage
      const id = Date.now().toString();
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
                  <h1 className="text-xl font-bold">Create Storyboard</h1>
                  <p className="text-sm text-gray-400">
                    Tell me about your video idea
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
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
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
                className={`w-full px-6 py-4 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                {isReady ? 'Generate Storyboard' : 'Try to Generate Anyway'}
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-3 text-purple-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating your storyboard...</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading || isGenerating}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isGenerating}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
