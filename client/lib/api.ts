/**
 * Backend API Configuration
 */

// Get backend URL from environment variable or use Vercel production as fallback
const getBackendUrl = (): string => {
  let url = "";
  if (typeof window !== "undefined") {
    // Check for environment variable first
    url = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mc-wi-cs-2026-teamcode-9kltmmx0v-minsikpaul92s-projects.vercel.app";
  } else {
    url = "https://mc-wi-cs-2026-teamcode-9kltmmx0v-minsikpaul92s-projects.vercel.app";
  }
  return url.replace(/\/$/, ""); // Strip trailing slash to prevent issues
};

export const BACKEND_URL = getBackendUrl();

// Get WebSocket URL (ws:// or wss://)
export const getWebSocketUrl = (path: string): string => {
  const backendUrl = BACKEND_URL;
  const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
  const wsHost = backendUrl.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
  return `${wsProtocol}://${wsHost}${path}`;
};
