"use client";

import { PI_NETWORK_CONFIG } from "@/lib/system-config";

export interface PiUser { uid: string; username: string; }
export interface PiLoginResult { success: boolean; accessToken?: string; user?: PiUser; error?: string; }
export interface PiVerifyResult { success: boolean; user?: PiUser; error?: string; }

const PI_BACKEND_URL = "https://pi-backend-zeta.vercel.app";
let sdkLoadPromise: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;

function loadPiSdkScript(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Pi) return resolve();
    const src = PI_NETWORK_CONFIG.SDK_URL;
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.Pi) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Pi SDK script")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pi SDK script"));
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

class PiService {
  user: PiUser | null = null;

  private async ensureInitialized(): Promise<void> {
    await loadPiSdkScript();
    if (!window.Pi) throw new Error("Pi SDK is not available");
    if (!initPromise) {
      initPromise = Promise.resolve(window.Pi.init({
        version: "2.0",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
      }));
    }
    await initPromise;
  }

  private onIncompletePaymentFound = async (payment: any) => {
    try {
      const paymentId = payment?.identifier;
      if (!paymentId) return;
      const txid = payment?.transaction?.txid || null;
      const response = await fetch(`${PI_BACKEND_URL}/pi/payments/incomplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, txid }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("[PiService] Failed to resolve incomplete payment:", data);
      } else {
        console.log("[PiService] Incomplete payment response:", data);
      }
    } catch (error) {
      console.error("[PiService] Incomplete payment error:", error);
    }
  };

  // Pi Browser: keep the existing payments scope and incomplete-payment handler.
  async login(): Promise<PiLoginResult> {
    try {
      await this.ensureInitialized();
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        this.onIncompletePaymentFound,
      );
      if (!auth?.user || !auth?.accessToken) throw new Error("Authentication failed - no user data");
      this.user = { uid: auth.user.uid, username: auth.user.username };
      return { success: true, accessToken: auth.accessToken, user: this.user };
    } catch (error) {
      console.error("[PiService] Pi Browser authentication error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Authentication failed" };
    }
  }

  // Ordinary browser: Pi Sign-In OAuth redirect.
  async startPiSignIn(): Promise<void> {
    await this.ensureInitialized();
    const sdk = window.Pi as any;
    if (typeof sdk.signIn !== "function") {
      throw new Error("Pi Sign-In is unavailable in this browser. Please reload and try again.");
    }
    const state = this.createOAuthState();
    sessionStorage.setItem("pi_oauth_state", state);
    sdk.signIn({
      clientId: PI_NETWORK_CONFIG.CLIENT_ID,
      redirectUri: PI_NETWORK_CONFIG.REDIRECT_URI,
      scopes: ["username"],
      state,
    });
  }

  private createOAuthState(): string {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  async verifyWithBackend(accessToken: string): Promise<PiVerifyResult> {
    try {
      const response = await fetch("/api/pi-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.user?.username || !data.user?.uid) {
        return { success: false, error: data.error || "Server rejected Pi access token" };
      }
      this.user = { uid: data.user.uid, username: data.user.username };
      return { success: true, user: this.user };
    } catch (error) {
      console.error("[PiService] Backend verification error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
  }

  async init(): Promise<void> { await this.ensureInitialized(); }
  logout(): void { this.user = null; }
}

export const piService = new PiService();
