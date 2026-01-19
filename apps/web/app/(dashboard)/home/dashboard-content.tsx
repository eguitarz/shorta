"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Link2, Lightbulb, BarChart3, Hammer, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoUpload } from "@/components/video-upload";

type AnalyzeMode = "url" | "upload";

interface Activity {
  id: string;
  title: string;
  type: string;
  timeAgo: string;
  status: string;
  activityType?: 'analysis' | 'generated' | 'created';
}

export default function DashboardContent() {
  const router = useRouter();
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>("url");
  const [topicInput, setTopicInput] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const handleAnalyze = () => {
    if (!analyzeUrl.trim()) return;

    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store URL in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      url: analyzeUrl.trim(),
      status: "pending"
    }));

    // Navigate directly to analysis page
    router.push(`/analyzer/${analysisId}`);
  };

  const handleUploadComplete = (fileUri: string, fileName: string) => {
    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Store fileUri in sessionStorage
    sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
      fileUri,
      fileName,
      status: "pending"
    }));

    // Navigate directly to analysis page
    router.push(`/analyzer/${analysisId}`);
  };

  const handleCreateStoryboard = () => {
    if (topicInput.trim()) {
      // Pass topic as query parameter
      router.push(`/storyboard/create?topic=${encodeURIComponent(topicInput.trim())}`);
    } else {
      router.push("/storyboard/create");
    }
  };

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await fetch('/api/activities/recent');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else {
          console.error('Failed to fetch activities');
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleActivityClick = (activity: Activity) => {
    if (activity.activityType === 'created') {
      // Created from scratch - navigate to storyboard generate page
      router.push(`/storyboard/generate/${activity.id}`);
    } else if (activity.activityType === 'generated') {
      // Generated from analysis - navigate to analyzer generate page
      router.push(`/analyzer/generate/${activity.id}`);
    } else {
      // Analysis job - navigate to analyzer page
      router.push(`/analyzer/${activity.id}`);
    }
  };

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Overview</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Dashboard</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-400">AI Directory Online</span>
          </div>

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Start with a proven hook.
            </h1>
            <p className="text-xl text-gray-400">
              Analyze viral hits or draft new concepts with AI-powered direction.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Analyze Short Card */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
                <BarChart3 className="w-4 h-4" />
                <span>Analyze Content</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                Analyze Short
              </h2>
              <p className="text-gray-400 mb-6">
                Paste a YouTube Short URL or upload a video to extract the hook, script structure, and retention score.
              </p>

              {/* Tab Toggle */}
              <div className="flex gap-1 p-1 bg-black/50 rounded-lg w-fit mb-4">
                <button
                  onClick={() => setAnalyzeMode("url")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${analyzeMode === "url"
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  URL
                </button>
                <button
                  onClick={() => setAnalyzeMode("upload")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${analyzeMode === "upload"
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>

              {analyzeMode === "url" ? (
                <>
                  <div className="mb-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Link2 className="w-5 h-5 text-gray-500" />
                      </div>
                      <Input
                        type="text"
                        placeholder="https://youtube.com/shorts/..."
                        value={analyzeUrl}
                        onChange={(e) => setAnalyzeUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && analyzeUrl.trim() && handleAnalyze()}
                        className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!analyzeUrl.trim()}
                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Run Analysis
                  </Button>
                </>
              ) : (
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                />
              )}
            </div>

            {/* Create from Topic Card */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
                <Hammer className="w-4 h-4" />
                <span>New Project</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                Create from Topic
              </h2>
              <p className="text-gray-400 mb-6">
                Generate a storyboard and script from a simple topic or raw idea.
              </p>
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lightbulb className="w-5 h-5 text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="e.g., AI productivity tools for designers..."
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateStoryboard()}
                    className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateStoryboard}
                className="w-full h-14 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-base"
              >
                <Hammer className="w-5 h-5 mr-2" />
                Generate Storyboard
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Recent Activity
              </h3>
              <button className="text-sm text-orange-500 hover:text-orange-400 font-medium">
                View All History
              </button>
            </div>

            <div className="space-y-1">
              {activitiesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activities. Start by analyzing a video!
                </div>
              ) : (
                activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.activityType === 'created' ? 'bg-green-500/10' :
                      activity.activityType === 'generated' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                      }`}>
                      {activity.activityType === 'created' ? (
                        <Hammer className="w-5 h-5 text-green-500" />
                      ) : activity.activityType === 'generated' ? (
                        <Hammer className="w-5 h-5 text-purple-500" />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium mb-1">{activity.title}</div>
                      <div className="text-sm text-gray-500">{activity.type} • {activity.timeAgo}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
