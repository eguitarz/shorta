/**
 * GET /api/feature-flags
 *
 * Returns the feature-flag state the client needs to conditionally render UI.
 * Public endpoint (no auth) — exposes only flags, no user data. Keeps
 * feature rollout decisions server-side where env vars live.
 */

import { NextResponse } from "next/server";
import { isAnimationModeEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export function GET() {
	return NextResponse.json({
		animation: isAnimationModeEnabled(),
	});
}
