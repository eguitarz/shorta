"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Plus, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface WatchListChannel {
  id: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  position: number;
}

interface SearchResult {
  channelId: string;
  title: string;
  thumbnail: string | null;
  description: string;
}

const MAX_CHANNELS = 10;

export function WatchListManager({
  open,
  onOpenChange,
  isPaid,
  onChannelsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPaid: boolean;
  onChannelsChange: () => void;
}) {
  const t = useTranslations("dashboard.watchList");
  const [channels, setChannels] = useState<WatchListChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/watch-list");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error("Failed to fetch watch list:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && isPaid) {
      fetchChannels();
    }
  }, [open, isPaid, fetchChannels]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/watch-list/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const handleAdd = async (channelId: string) => {
    setAdding(channelId);
    try {
      const res = await fetch("/api/watch-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (res.ok) {
        await fetchChannels();
        setSearchQuery("");
        setSearchResults([]);
        onChannelsChange();
      }
    } catch (error) {
      console.error("Failed to add channel:", error);
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (channelId: string) => {
    setRemoving(channelId);
    try {
      const res = await fetch(`/api/watch-list/${channelId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChannels((prev) =>
          prev.filter((c) => c.channel_id !== channelId)
        );
        onChannelsChange();
      }
    } catch (error) {
      console.error("Failed to remove channel:", error);
    } finally {
      setRemoving(null);
    }
  };

  const existingIds = new Set(channels.map((c) => c.channel_id));

  if (!isPaid) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#141414] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-500" />
              {t("title")}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Crown className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">{t("paidOnly")}</p>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {t("upgradeCta")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("title")}
            <span className="text-sm font-normal text-gray-400">
              {channels.length} / {MAX_CHANNELS}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        {channels.length < MAX_CHANNELS && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600"
            />
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border border-gray-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((result) => {
              const alreadyAdded = existingIds.has(result.channelId);
              return (
                <div
                  key={result.channelId}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800/50 border-b border-gray-800 last:border-b-0"
                >
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={alreadyAdded || adding === result.channelId}
                    onClick={() => handleAdd(result.channelId)}
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 h-8 px-2"
                  >
                    {alreadyAdded ? (
                      <span className="text-xs text-gray-500">
                        {t("added")}
                      </span>
                    ) : adding === result.channelId ? (
                      <span className="text-xs">{t("adding")}</span>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {searching && (
          <p className="text-xs text-gray-500 text-center">{t("searching")}</p>
        )}

        {/* Current channels list */}
        <div className="space-y-1 mt-2">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {t("loading")}
            </p>
          ) : channels.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {t("empty")}
            </p>
          ) : (
            channels.map((channel) => (
              <div
                key={channel.channel_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-gray-800"
              >
                {channel.channel_thumbnail && (
                  <img
                    src={channel.channel_thumbnail}
                    alt=""
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <span className="flex-1 text-sm font-medium truncate">
                  {channel.channel_title}
                </span>
                <button
                  onClick={() => handleRemove(channel.channel_id)}
                  disabled={removing === channel.channel_id}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
