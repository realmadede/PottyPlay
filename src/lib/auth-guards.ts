import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { AdminAuthService } from "@/features/admin/admin-auth-service";

/**
 * Shared authentication and tenant-isolation guard for cinema operator APIs.
 *
 * - An authenticated cinema operator is ALWAYS bound to the cinema stored on its session.
 *   Any cinema identifier supplied by the client that differs from it is rejected.
 * - A platform administrator is accepted only if the HMAC-signed admin token is valid
 *   (signature, expiry and active DB record are verified). A bare "adm_" prefix grants nothing.
 */

export type GuardRole = "ADMIN" | "MANAGER" | "PROJECTIONIST";

export interface OperatorContext {
  kind: "operator" | "admin";
  /** Operator: always the session cinema. Admin: the explicitly requested cinema or null. */
  cinemaId: string | null;
  /** Operator role, or null for platform administrators. */
  role: GuardRole | null;
}

export type GuardResult =
  | { ok: true; ctx: OperatorContext }
  | { ok: false; response: NextResponse };

function deny(status: number, error: string): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status }),
  };
}

/**
 * Extracts a bearer token from the Authorization header, falling back to the given cookie names.
 */
export function extractToken(req: NextRequest, cookieNames: string[]): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match && match[1].trim()) return match[1].trim();
  }
  for (const name of cookieNames) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return null;
}

/**
 * Authenticates a cinema operator (or validated platform administrator) and resolves the
 * cinema the request is allowed to act on.
 *
 * @param req incoming request
 * @param options.roles when provided, only these operator roles (and platform admins) are allowed
 * @param options.requestedCinemaId optional cinema id taken from the request body
 */
export async function requireOperator(
  req: NextRequest,
  options: { roles?: GuardRole[]; requestedCinemaId?: string | null } = {}
): Promise<GuardResult> {
  const token = extractToken(req, ["pp_operator_token", "pp_admin_token"]);
  if (!token) {
    return deny(401, "Unauthorized operator access. Valid session token required.");
  }

  const requestedCinemaIds = new Set<string>();
  const queryCinemaId = req.nextUrl.searchParams.get("cinemaId");
  const headerCinemaId = req.headers.get("x-cinema-id");
  for (const value of [queryCinemaId, headerCinemaId, options.requestedCinemaId]) {
    if (value && value.trim()) requestedCinemaIds.add(value.trim());
  }

  if (token.startsWith("adm_")) {
    const validAdmin = await AdminAuthService.validateSession(token);
    if (!validAdmin) {
      return deny(401, "Invalid or expired administrator session.");
    }
    if (requestedCinemaIds.size > 1) {
      return deny(400, "Conflicting cinema identifiers supplied.");
    }
    const [requested] = Array.from(requestedCinemaIds);
    return { ok: true, ctx: { kind: "admin", cinemaId: requested ?? null, role: null } };
  }

  const session = await OperatorAuthService.verifySession(token);
  if (!session) {
    return deny(401, "Invalid or expired operator session.");
  }

  for (const requested of requestedCinemaIds) {
    if (requested !== session.cinemaId) {
      return deny(403, "Access to the requested cinema is not permitted.");
    }
  }

  const role = session.role as GuardRole;
  if (options.roles && !options.roles.includes(role)) {
    return deny(403, "Your role is not permitted to perform this action.");
  }

  return { ok: true, ctx: { kind: "operator", cinemaId: session.cinemaId, role } };
}

/**
 * Masks a phone number so that only the country prefix and last three digits remain.
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.length <= 7) return "***";
  return `${trimmed.slice(0, 4)}${"*".repeat(trimmed.length - 7)}${trimmed.slice(-3)}`;
}

/**
 * Masks a sensitive token or claim code for safe inclusion in audit trails and logs.
 */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "";
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "***";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Authenticates a platform administrator using a signed, unexpired admin token
 * (Authorization header or pp_admin_token cookie).
 */
export async function requireAdmin(req: NextRequest): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const token = extractToken(req, ["pp_admin_token"]);
  if (!token || !(await AdminAuthService.validateSession(token))) {
    return deny(401, "Unauthorized admin access.") as { ok: false; response: NextResponse };
  }
  return { ok: true };
}
