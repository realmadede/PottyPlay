import { NativeMobile } from "@/lib/native-mobile";

declare global {
  interface Window {
    POTTYPLAY_API_BASE_URL?: string;
    POTTYPLAY_EMULATOR_DEV?: boolean;
  }
}

export function customerUrl(path: string): string {
  if (typeof window === "undefined" || !window.POTTYPLAY_API_BASE_URL) {
    return path;
  }

  return new URL(path, window.POTTYPLAY_API_BASE_URL).toString();
}

export async function customerFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (typeof window === "undefined" || !window.POTTYPLAY_API_BASE_URL) {
    const response = await fetch(path, init);
    notifyCustomerSessionExpiry(path, response.status);
    return response;
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) {
    const token = await NativeMobile.getStorageItem("pp_cust_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(customerUrl(path), {
    ...init,
    headers,
    credentials: "omit",
  });
  notifyCustomerSessionExpiry(path, response.status);
  return response;
}

function notifyCustomerSessionExpiry(path: string, status: number): void {
  if (
    status === 401 &&
    !path.startsWith("/api/sessions/") &&
    !/\/api\/auth\/customer\/(?:login|register|verify-|forgot-password)/.test(path)
  ) {
    window.dispatchEvent(new CustomEvent("pottyplay:session-expired"));
  }
}
