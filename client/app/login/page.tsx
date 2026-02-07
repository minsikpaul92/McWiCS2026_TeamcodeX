"use client"

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
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

        {/* Google Login Button */}
        <button 
          type="button"
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-secondary text-secondary-foreground border border-border rounded-lg hover:bg-secondary/80 transition-all font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-space-grotesk">Or email login</span>
          </div>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email Address
            </label>
            <input 
              id="email" 
              type="email" 
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all" 
              required 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" size="sm" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              id="password" 
              type="password" 
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all" 
              required 
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 mt-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
          >
            Sign In
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