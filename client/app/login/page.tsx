"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For navigation
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter(); // Initialize the router

  // 1. STATE FOR FORM DATA
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 2. AUTHENTICATION & REDIRECTION LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Calling your FastAPI backend /auth prefix
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        /* --- SUCCESS: MATCH FOUND IN DATABASE --- */
        console.log("Match confirmed! Redirecting...");

        // Save user session so the Home page knows who you are
        localStorage.setItem("user_db_id", data.user.id);
        localStorage.setItem("user_session", JSON.stringify(data.user));

        // TAKE USER TO HOME PAGE
        router.push("/dashboard");
      } else {
        /* --- FAILURE: WRONG DETAILS --- */
        setError(data.detail || "Invalid email or password");
      }
    } catch (err) {
      setError("Server connection failed. Is your FastAPI running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md space-y-6 p-8 border border-border rounded-2xl bg-card/50 backdrop-blur-sm shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-space-grotesk tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Continue your journey at your own pace.
          </p>
        </div>


        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message Box */}
          {error && (
            <div className="p-3 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Link href="/forgot-password" size="sm" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-6 mt-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.95]"
          >
            {isLoading ? "Checking Database..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  );
}