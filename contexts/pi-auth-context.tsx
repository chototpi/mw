"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { piService } from "@/lib/pi-service";

interface PiAuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  authMessage: string;
  hasError: boolean;
  username: string | null;
  uid: string | null;
  accessToken: string | null;
  reinitialize: () => Promise<void>;
  completeOAuthLogin: (accessToken: string) => Promise<void>;
  logout: () => void;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

function isPiBrowser(): boolean {
  return typeof navigator !== "undefined" && /pibrowser/i.test(navigator.userAgent);
}

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authMessage, setAuthMessage] = useState("Checking saved login...");
  const [hasError, setHasError] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const saveLogin = useCallback((name: string, userId: string, token: string) => {
    setUsername(name);
    setUid(userId);
    setAccessToken(token);
    setIsAuthenticated(true);
    setHasError(false);
    setAuthMessage("Connected to Pi Network");
    localStorage.setItem("pi_username", name);
    localStorage.setItem("uid", userId);
    localStorage.setItem("accessToken", token);
  }, []);

  const completeOAuthLogin = useCallback(async (token: string) => {
    setIsInitializing(true);
    setHasError(false);
    setAuthMessage("Verifying Pi account...");
    try {
      const result = await piService.verifyWithBackend(token);
      if (!result.success || !result.user) throw new Error(result.error || "Could not verify Pi account");
      saveLogin(result.user.username, result.user.uid, token);
    } finally {
      setIsInitializing(false);
    }
  }, [saveLogin]);

  const reinitialize = useCallback(async () => {
    setIsInitializing(true);
    setHasError(false);
    try {
      if (!isPiBrowser()) {
        setAuthMessage("Redirecting to Pi Sign-In...");
        await piService.startPiSignIn();
        return;
      }
      setAuthMessage("Authenticating...");
      const login = await piService.login();
      if (!login.success || !login.accessToken) throw new Error(login.error || "Failed");
      setAuthMessage("Verifying...");
      const verified = await piService.verifyWithBackend(login.accessToken);
      if (!verified.success || !verified.user) throw new Error(verified.error || "Server rejected Pi account");
      saveLogin(verified.user.username, verified.user.uid, login.accessToken);
    } catch (error) {
      console.error("[PiAuth] Authentication failed:", error);
      setIsAuthenticated(false);
      setHasError(true);
      setAuthMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsInitializing(false);
    }
  }, [saveLogin]);

  const logout = useCallback(() => {
    piService.logout();
    localStorage.removeItem("pi_username");
    localStorage.removeItem("uid");
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    setUsername(null);
    setUid(null);
    setAccessToken(null);
    setHasError(false);
    setAuthMessage("Logged out");
  }, []);

  // Restore the existing local session; do not trigger an automatic Pi popup.
  useEffect(() => {
    const name = localStorage.getItem("pi_username");
    const userId = localStorage.getItem("uid");
    const token = localStorage.getItem("accessToken");
    if (name && userId && token) {
      setUsername(name);
      setUid(userId);
      setAccessToken(token);
      setIsAuthenticated(true);
      setAuthMessage("Connected to Pi Network");
    } else {
      setIsAuthenticated(false);
    }
    setIsInitializing(false);
  }, []);

  return (
    <PiAuthContext.Provider value={{
      isAuthenticated, isInitializing, authMessage, hasError,
      username, uid, accessToken, reinitialize, completeOAuthLogin, logout,
    }}>
      {children}
    </PiAuthContext.Provider>
  );
}

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) throw new Error("usePiAuth must be used within a PiAuthProvider");
  return context;
}
