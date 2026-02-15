"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Plus, Trash2, Crown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface WatchListChannel {
  id: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  position: number;
}

const MAX_CHANNELS = 10;

/**
 * Extract a YouTube channel ID from various URL formats:
 *  - https://www.youtube.com/channel/UC...
 *  - https://www.youtube.com/@handle
 *  - https://youtube.com/c/ChannelName
 *  - raw channel ID (UC...)
 */
function parseChannelInput(input: string): { type: 'id' | 'handle' | 'slug'; value: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw channel ID (starts with UC and is 24 chars)
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
      return null;
    }

    const path = url.pathname;

    // /channel/UC...
    const channelMatch = path.match(/^\/channel\/(UC[\w-]{22})/);
    if (channelMatch) {
      return { type: 'id', value: channelMatch[1] };
    }

    // /@handle
    const handleMatch = path.match(/^\/@([\w.-]+)/);
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1] };
    }

    // /c/Name or /user/Name
    const slugMatch = path.match(/^\/(c|user)\/([\w.-]+)/);
    if (slugMatch) {
      return { type: 'slug', value: slugMatch[2] };
    }
  } catch {
    // not a valid URL
  }

  return null;
}

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
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

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

  const handleAdd = async () => {
    setAddError(null);
    const parsed = parseChannelInput(urlInput);

    if (!parsed) {
      setAddError(t("invalidUrl"));
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/watch-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          parsed.type === 'id'
            ? { channelId: parsed.value }
            : parsed.type === 'handle'
              ? { handle: parsed.value }
              : { slug: parsed.value }
        ),
      });

      if (res.ok) {
        await fetchChannels();
        setUrlInput("");
        onChannelsChange();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error || t("addFailed"));
      }
    } catch (error) {
      console.error("Failed to add channel:", error);
      setAddError(t("addFailed"));
    } finally {
      setAdding(false);
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

        {/* Add channel by URL */}
        {channels.length < MAX_CHANNELS && (
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder={t("urlPlaceholder")}
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setAddError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && urlInput.trim() && handleAdd()}
                  className="pl-9 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={!urlInput.trim() || adding}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4"
              >
                {adding ? (
                  <span className="text-sm">{t("adding")}</span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            {addError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">{t("urlHint")}</p>
          </div>
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
