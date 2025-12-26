"use client";

import { Bell, Link2, Lightbulb, BarChart3, Hammer, BookOpen, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SignOutButton from "./sign-out-button";

const shortaLogo = "/shorta-logo.png";

interface DashboardContentProps {
  user: any;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  // Get user initials for avatar
  const initials = user.email
    ?.split("@")[0]
    .slice(0, 2)
    .toUpperCase() || "JD";

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img src={shortaLogo} alt="Shorta" className="h-8 w-8" />
            <span className="text-xl font-semibold">Shorta</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analyzer</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 transition-colors">
              <Hammer className="w-5 h-5" />
              <span className="font-medium">Build</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 transition-colors">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="uppercase tracking-wider">System Operational</span>
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">
            Shorta AI v2.4.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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

            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-semibold">
                {initials}
              </div>
              <SignOutButton />
            </div>
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
            <div className="grid grid-cols-2 gap-6 mb-16">
              {/* Analyze Short URL Card */}
              <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
                  <Link2 className="w-4 h-4" />
                  <span>Analyze Content</span>
                </div>
                <h2 className="text-2xl font-semibold mb-3">
                  Analyze Short URL
                </h2>
                <p className="text-gray-400 mb-6">
                  Paste a YouTube Short URL to extract the hook, script structure, and retention score.
                </p>
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Link2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <Input
                      type="text"
                      placeholder="https://youtube.com/shorts/..."
                      className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                    />
                  </div>
                </div>
                <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-base">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Run Analysis
                </Button>
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
                      className="w-full bg-[#0a0a0a] border-gray-800 rounded-xl h-14 pl-12 text-gray-400 placeholder:text-gray-600"
                    />
                  </div>
                </div>
                <Button className="w-full h-14 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-base">
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
                {/* Activity Item 1 */}
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors group">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium mb-1">How to edit 10x faster</div>
                    <div className="text-sm text-gray-500">Analysis • 2 hours ago</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                </button>

                {/* Activity Item 2 */}
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors group">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hammer className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium mb-1">Crypto News Weekly</div>
                    <div className="text-sm text-gray-500">Draft • Yesterday</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                </button>

                {/* Activity Item 3 */}
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors group">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium mb-1">My desk setup tour 2024</div>
                    <div className="text-sm text-gray-500">Analysis • 2 days ago</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
