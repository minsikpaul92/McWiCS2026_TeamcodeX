/**
 * Backend API Configuration
 * 
 * MULTI-DEVICE SETUP (for testing with friends on different devices):
 * 
 * Option 1 - Environment Variable (Recommended):
 *   1. Create/edit .env.local in the client folder
 *   2. Add: NEXT_PUBLIC_BACKEND_URL=http://YOUR_SERVER_IP:8000
 *   3. Example: NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
 *   4. Restart your Next.js dev server
 * 
 * Option 2 - Quick Code Change:
 *   Replace "localhost" below with your server's IP address
 *   Example: return "http://192.168.1.100:8000";
 * 
 * FINDING YOUR SERVER IP:
 *   Windows: ipconfig (look for IPv4 Address)
 *   Mac/Linux: ifconfig or ip addr (look for inet)
 * 
 * IMPORTANT: Make sure your backend server is running and accessible on port 8000
 */

// Get backend URL from environment variable or use localhost as fallback
const getBackendUrl = (): string => {
  if (typeof window !== "undefined") {
    // Check for environment variable first (best for production/multi-device)
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl;

    // QUICK FIX: Replace 'localhost' with your server IP for multi-device testing
    // Example: return "http://192.168.1.100:8000";

    // Default to Vercel production for single-device development
    return "http://192.168.1.100:8000";
  }
  return "http://192.168.1.100:8000";
};

export const BACKEND_URL = getBackendUrl();

// Get WebSocket URL (ws:// or wss://)
export const getWebSocketUrl = (path: string): string => {
  const backendUrl = BACKEND_URL;
  const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
  const wsHost = backendUrl.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
  return `${wsProtocol}://${wsHost}${path}`;
};
