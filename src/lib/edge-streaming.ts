import { NextRequest } from "next/server";

export interface EdgeCinemaConfig {
  edgeStreamingEnabled?: boolean | null;
  edgeServerUrl?: string | null;
  venueWifiSsid?: string | null;
  lanIpSubnets?: string | null;
}

export interface EdgeContentAsset {
  videoUrl: string;
  edgeRelativePath?: string | null;
}

export interface ResolvedPlaybackStreams {
  primaryVideoUrl: string;
  edgeVideoUrl: string | null;
  venueWifiSsid: string | null;
  isLanClient: boolean;
  preferredRoute: "LAN_EDGE" | "WAN_CDN";
}

/**
 * Converts an IPv4 string into a 32-bit unsigned integer.
 * Returns null if the string is not a valid IPv4 address.
 */
export function ipv4ToUint32(ip: string): number | null {
  const cleanIp = ip.trim();
  const parts = cleanIp.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (let i = 0; i < 4; i++) {
    const octet = Number(parts[i]);
    if (isNaN(octet) || octet < 0 || octet > 255 || parts[i] !== octet.toString()) {
      return null;
    }
    result = ((result << 8) | octet) >>> 0;
  }
  return result;
}

/**
 * Checks whether an IPv4 address belongs to a specified CIDR range (e.g. "192.168.1.0/24").
 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.trim().split("/");
  const ipNum = ipv4ToUint32(ip);
  const netNum = ipv4ToUint32(network);

  if (ipNum === null || netNum === null) return false;

  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : 32;
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  if (prefix === 0) return true;

  const mask = ((0xffffffff << (32 - prefix)) >>> 0);
  return (ipNum & mask) === (netNum & mask);
}

/**
 * Checks whether an IP belongs to standard RFC 1918 private subnets or loopback.
 */
export function isRfc1918PrivateIp(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/, "").trim();
  return (
    isIpInCidr(cleanIp, "10.0.0.0/8") ||
    isIpInCidr(cleanIp, "172.16.0.0/12") ||
    isIpInCidr(cleanIp, "192.168.0.0/16") ||
    isIpInCidr(cleanIp, "127.0.0.0/8") ||
    cleanIp === "::1" ||
    cleanIp === "localhost"
  );
}

/**
 * Checks whether a client IP belongs to the cinema's configured LAN subnets
 * or standard private network boundaries.
 */
export function isClientOnCinemaLan(
  clientIp?: string | null,
  configuredSubnets?: string | null
): boolean {
  if (!clientIp) return false;
  const cleanIp = clientIp.replace(/^::ffff:/, "").trim();

  // If specific subnets are configured by the theater operator, check them first
  if (configuredSubnets && configuredSubnets.trim().length > 0) {
    const subnets = configuredSubnets
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const subnet of subnets) {
      if (isIpInCidr(cleanIp, subnet)) {
        return true;
      }
    }
  }

  // Fallback: check if client is within RFC 1918 private ranges (e.g. theater LAN Wi-Fi DHCP pool)
  return isRfc1918PrivateIp(cleanIp);
}

/**
 * Extracts client IP from incoming NextRequest headers.
 */
export function extractClientIp(req: NextRequest | Headers): string {
  const headers = req instanceof NextRequest ? req.headers : req;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Resolves dual streaming paths (WAN CDN vs. LAN Edge micro-cache)
 * to ensure patrons in Faraday-cage auditoriums experience zero buffering.
 */
export function resolvePlaybackStreamUrls(params: {
  contentAsset: EdgeContentAsset;
  cinema?: EdgeCinemaConfig | null;
  clientIp?: string | null;
}): ResolvedPlaybackStreams {
  const { contentAsset, cinema, clientIp } = params;
  const primaryVideoUrl = contentAsset.videoUrl;

  const edgeEnabled = Boolean(cinema?.edgeStreamingEnabled && cinema?.edgeServerUrl);
  let edgeVideoUrl: string | null = null;

  if (edgeEnabled && cinema?.edgeServerUrl) {
    const serverBase = cinema.edgeServerUrl.replace(/\/+$/, "");

    if (contentAsset.edgeRelativePath) {
      const relPath = contentAsset.edgeRelativePath.replace(/^\/+/, "");
      edgeVideoUrl = `${serverBase}/${relPath}`;
    } else {
      try {
        const parsed = new URL(contentAsset.videoUrl);
        edgeVideoUrl = `${serverBase}${parsed.pathname}${parsed.search}`;
      } catch {
        // If not a full URL, append directly
        edgeVideoUrl = `${serverBase}/${contentAsset.videoUrl.replace(/^\/+/, "")}`;
      }
    }
  }

  const isLanClient = isClientOnCinemaLan(clientIp, cinema?.lanIpSubnets);
  const preferredRoute = (edgeEnabled && edgeVideoUrl && isLanClient) ? "LAN_EDGE" : "WAN_CDN";

  return {
    primaryVideoUrl,
    edgeVideoUrl,
    venueWifiSsid: cinema?.venueWifiSsid || null,
    isLanClient,
    preferredRoute,
  };
}
