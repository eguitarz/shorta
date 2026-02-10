"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { YouTubeConnectionInfo } from "@/lib/youtube/types";

// YouTube brand icon (simplified SVG path)
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export function YouTubeConnectCard() {
  const t = useTranslations("dashboard.youtubeConnect");
  const searchParams = useSearchParams();
  const [connectionInfo, setConnectionInfo] = useState<YouTubeConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const didLoad = useRef(false);

  // Check for connection result from OAuth callback
  const youtubeParam = searchParams.get("youtube");

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    fetch("/api/auth/youtube/status")
      .then((res) => res.json())
      .then((data) => setConnectionInfo(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    // Redirect to OAuth initiation
    window.location.href = "/api/auth/youtube/initiate";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/youtube/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setConnectionInfo({
          connected: false,
          channelId: null,
          channelTitle: null,
          channelThumbnail: null,
          subscriberCount: null,
          videoCount: null,
          status: null,
          lastVideoSync: null,
        });
        // Notify sidebar to update
        window.dispatchEvent(new Event("youtube-connection-changed"));
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setDisconnecting(false);
      setConfirmingDisconnect(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  // Connected state
  if (connectionInfo?.connected) {
    return (
      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
          <YouTubeIcon className="w-4 h-4 text-red-500" />
          <span>{t("label")}</span>
          <span className="ml-auto flex items-center gap-1 text-green-500 text-[10px] font-medium normal-case tracking-normal">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {t("connected")}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {connectionInfo.channelThumbnail && (
            <img
              src={connectionInfo.channelThumbnail}
              alt={connectionInfo.channelTitle || "Channel"}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">
              {connectionInfo.channelTitle || "Your Channel"}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {connectionInfo.subscriberCount != null && (
                <span>
                  {new Intl.NumberFormat(undefined, { notation: "compact" }).format(connectionInfo.subscriberCount)} {t("subscribers")}
                </span>
              )}
              {connectionInfo.videoCount != null && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{connectionInfo.videoCount} {t("videos")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {connectionInfo.lastVideoSync && (
          <p className="text-xs text-gray-500 mb-4">
            {t("lastSync")}: {new Date(connectionInfo.lastVideoSync).toLocaleString()}
          </p>
        )}

        {connectionInfo.status === "needs_reauth" && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-400">{t("needsReauth")}</p>
            <Button
              onClick={handleConnect}
              variant="outline"
              size="sm"
              className="mt-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              {t("reconnect")}
            </Button>
          </div>
        )}

        {confirmingDisconnect ? (
          <div className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
            <span className="text-xs text-red-400 flex-1">{t("disconnectConfirm")}</span>
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : t("yes")}
            </Button>
            <Button
              onClick={() => setConfirmingDisconnect(false)}
              disabled={disconnecting}
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {t("no")}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setConfirmingDisconnect(true)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Unplug className="w-4 h-4 mr-2" />
            {t("disconnect")}
          </Button>
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
        <YouTubeIcon className="w-4 h-4" />
        <span>{t("label")}</span>
      </div>
      <h2 className="text-2xl font-semibold mb-3">{t("title")}</h2>
      <p className="text-gray-400 mb-6">{t("description")}</p>

      {youtubeParam === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{t("connectionError")}</p>
        </div>
      )}

      <Button
        onClick={handleConnect}
        className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-base"
      >
        <YouTubeIcon className="w-5 h-5 mr-2" />
        {t("connectButton")}
      </Button>
    </div>
  );
}
