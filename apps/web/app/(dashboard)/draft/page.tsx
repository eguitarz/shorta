"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BuildRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/storyboard/create");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
