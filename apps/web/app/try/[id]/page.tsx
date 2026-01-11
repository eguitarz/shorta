"use client";

/**
 * Public Trial Analyzer Results Page
 *
 * Shows analysis results for anonymous users
 * No authentication required - perfect for sharing
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TryResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  useEffect(() => {
    // Redirect to main analyzer with trial param
    // This allows the middleware to permit anonymous access
    if (jobId) {
      router.replace(`/analyzer/${jobId}?trial=true`);
    }
  }, [jobId, router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading analysis...</div>
    </div>
  );
}
