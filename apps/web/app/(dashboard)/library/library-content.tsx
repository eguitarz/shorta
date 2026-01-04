// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Plus,
  BarChart3,
  Hammer,
  MoreVertical,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function LibraryContent() {
  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold">Library</h1>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search your library..."
                className="w-full bg-[#141414] border-gray-800 rounded-xl h-12 pl-12 text-gray-400 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">Total Projects</div>
              <div className="text-2xl font-bold">24</div>
            </div>
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">Analyzed</div>
              <div className="text-2xl font-bold">18</div>
            </div>
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">Drafts</div>
              <div className="text-2xl font-bold">6</div>
            </div>
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">Avg Score</div>
              <div className="text-2xl font-bold">78</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mb-6 border-b border-gray-800">
            <button className="pb-3 border-b-2 border-orange-500 text-white font-medium">
              All Projects
            </button>
            <button className="pb-3 text-gray-400 hover:text-white">
              Analyzed
            </button>
            <button className="pb-3 text-gray-400 hover:text-white">
              Drafts
            </button>
            <button className="pb-3 text-gray-400 hover:text-white">
              Favorites
            </button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Project Card 1 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-orange-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  How to edit 10x faster
                </h3>
                <p className="text-sm text-gray-500 mb-3">Analysis • 2 hours ago</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">82</span>
                    </div>
                    <span className="text-xs text-gray-600">/100</span>
                  </div>
                  <div className="text-xs text-gray-500">3.2s hook</div>
                </div>
              </div>
            </div>

            {/* Project Card 2 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-purple-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Hammer className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  Crypto News Weekly
                </h3>
                <p className="text-sm text-gray-500 mb-3">Draft • Yesterday</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">In progress</div>
                  <div className="text-xs text-gray-500">2.8s hook</div>
                </div>
              </div>
            </div>

            {/* Project Card 3 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-orange-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  My desk setup tour 2024
                </h3>
                <p className="text-sm text-gray-500 mb-3">Analysis • 2 days ago</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">76</span>
                    </div>
                    <span className="text-xs text-gray-600">/100</span>
                  </div>
                  <div className="text-xs text-gray-500">4.1s hook</div>
                </div>
              </div>
            </div>

            {/* Project Card 4 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-orange-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  5 AI tools you need
                </h3>
                <p className="text-sm text-gray-500 mb-3">Analysis • 3 days ago</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">91</span>
                    </div>
                    <span className="text-xs text-gray-600">/100</span>
                  </div>
                  <div className="text-xs text-gray-500">2.5s hook</div>
                </div>
              </div>
            </div>

            {/* Project Card 5 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-purple-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Hammer className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  Morning routine that changed my life
                </h3>
                <p className="text-sm text-gray-500 mb-3">Draft • 4 days ago</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">In progress</div>
                  <div className="text-xs text-gray-500">3.5s hook</div>
                </div>
              </div>
            </div>

            {/* Project Card 6 */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative">
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 bg-orange-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-orange-500 transition-colors">
                  Why I quit my job
                </h3>
                <p className="text-sm text-gray-500 mb-3">Analysis • 5 days ago</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">85</span>
                    </div>
                    <span className="text-xs text-gray-600">/100</span>
                  </div>
                  <div className="text-xs text-gray-500">3.8s hook</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
