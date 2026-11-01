import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ScreeningService } from "@/features/screenings/screening-service";
import { SessionStatus, ScreeningStatus } from "@prisma/client";
import { extractToken, requireOperator } from "@/lib/auth-guards";
import { extractClientIp } from "@/lib/edge-streaming";
import { hashToken } from "@/lib/crypto";

/**
 * Returns the authoritative playback state of a screening.
 *
 * - Patrons authenticate with their active break-session token and only ever receive the
 *   screening their session belongs to (any screeningId they pass is ignored).
 * - Cinema operators authenticate with their operator token and receive screenings of their own cinema.
 * - Platform administrators may pass ?cinemaId= and ?screeningId=.
 * There is no anonymous access and no default screening.
 */
export async function GET(req: NextRequest) {
  try {
    const token =
      extractToken(req, ["pottyplay_token", "pp_operator_token", "pp_admin_token"]) ||
      req.headers.get("x-session-token");

    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let screeningId: string | null = null;

    if (token.startsWith("opr_") || token.startsWith("adm_")) {
      const guard = await requireOperator(req);
      if (!guard.ok) return guard.response;

      const cinemaScope = guard.ctx.cinemaId ? { cinemaId: guard.ctx.cinemaId } : {};
      const requestedId = req.nextUrl.searchParams.get("screeningId");

      const screening = requestedId
        ? await prisma.screening.findFirst({
            where: { id: requestedId, ...cinemaScope },
            select: { id: true },
          })
        : await prisma.screening.findFirst({
            where: {
              ...cinemaScope,
              status: { in: [ScreeningStatus.PLAYING, ScreeningStatus.PAUSED, ScreeningStatus.SCHEDULED] },
            },
            orderBy: { scheduledStart: "asc" },
            select: { id: true },
          });
      screeningId = screening?.id ?? null;
    } else {
      const tokenHash = hashToken(token);
      const session = await prisma.breakSession.findFirst({
        where: {
          OR: [
            { sessionTokenHash: tokenHash },
            { sessionToken: token },
          ],
        },
        select: { screeningId: true, status: true, expiresAt: true },
      });
      if (
        !session ||
        session.status !== SessionStatus.ACTIVE ||
        session.expiresAt.getTime() <= Date.now()
      ) {
        return NextResponse.json({ error: "Invalid or expired session." }, { status: 403 });
      }
      screeningId = session.screeningId;
    }

    if (!screeningId) {
      return NextResponse.json({ error: "No screening found." }, { status: 404 });
    }

    const clientIp = extractClientIp(req);
    const state = await ScreeningService.getAuthoritativePlaybackState(screeningId, clientIp);
    if (!state) {
      return NextResponse.json({ error: "No screening found." }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (err: unknown) {
    console.error("[SCREENINGS-CURRENT] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
