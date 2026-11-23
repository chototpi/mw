"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { usePiAuth } from "@/contexts/pi-auth-context";

export default function PiSignInCallbackPage() {
  const router = useRouter();
  const { completeOAuthLogin } = usePiAuth();
  const [message, setMessage] = useState("Completing Pi Sign-In...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const finish = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const returnedState = params.get("state");
        const expectedState = sessionStorage.getItem("pi_oauth_state");

        // Remove token and OAuth parameters from browser history/address bar.
        window.history.replaceState(null, "", window.location.pathname);
        sessionStorage.removeItem("pi_oauth_state");

        if (!expectedState || returnedState !== expectedState) {
          throw new Error("Pi Sign-In state validation failed. Please try again.");
        }
        const oauthError = params.get("error");
        if (oauthError) throw new Error(`Pi Sign-In was not completed: ${oauthError}`);

        const token = params.get("access_token");
        if (!token) throw new Error("Pi Sign-In did not return an access token.");

        setMessage("Verifying your Pi account...");
        await completeOAuthLogin(token);
        if (cancelled) return;
        setMessage("Login successful. Redirecting...");
        router.replace("/");
      } catch (err) {
        if (cancelled) return;
        console.error("[Pi Sign-In Callback]", err);
        setError(err instanceof Error ? err.message : "Unable to complete Pi Sign-In");
      }
    };
    void finish();
    return () => { cancelled = true; };
  }, [completeOAuthLogin, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        {error ? <>
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-600" />
          <h1 className="text-xl font-semibold">Login failed</h1>
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <button type="button" onClick={() => router.replace("/")} className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Back to Mobile World</button>
        </> : <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <h1 className="text-xl font-semibold">Pi Sign-In</h1>
          <p className="mt-3 text-sm text-gray-600">{message}</p>
        </>}
      </div>
    </main>
  );
}
