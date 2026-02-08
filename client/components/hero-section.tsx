"use client"

import Link from "next/link" // Added Link import
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"

// ... HalftoneBackground component stays exactly the same ...
function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
      draw()
    }

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const isDark = document.documentElement.classList.contains("dark")
      const spacing = 18
      const maxR = 3.5
      const hue = isDark ? "75, 100%, 62%" : "75, 100%, 35%"

      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          const distX = x / w
          const distY = y / h
          const dist = Math.sqrt(
            (distX - 0.8) * (distX - 0.8) + (distY - 0.3) * (distY - 0.3)
          )
          const size = Math.max(0, maxR * (1 - dist * 1.5))
          if (size > 0.2) {
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${hue}, ${0.15 + (size / maxR) * 0.35})`
            ctx.fill()
          }
        }
      }
    }

    resize()
    window.addEventListener("resize", resize)

    const observer = new MutationObserver(() => {
      resize()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      window.removeEventListener("resize", resize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}

export function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const savedSession = localStorage.getItem("user_session")
    if (savedSession) {
      setIsLoggedIn(true)
    }
  }, [])

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-20"
    >
      <HalftoneBackground />

      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute right-[10%] top-[20%] h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "hsl(75, 100%, 62%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[10%] left-[5%] h-[300px] w-[300px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "hsl(75, 100%, 62%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
            Built for introverts, by introverts
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl lg:text-8xl animate-fade-in-up text-balance">
            Find Friends,{" "}
            <span className="text-primary">At Your Own Pace.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl animate-fade-in-up [animation-delay:200ms] text-pretty">
            A safe and comfortable space for introverts to connect through
            AI-powered matching. No pressure, no judgment — just genuine
            friendships.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up [animation-delay:400ms]">
            {/* Primary Action Button linked to Signup or Dashboard */}
            <Button
              asChild
              size="lg"
              className="group rounded-full px-10 text-base font-medium transition-all"
            >
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}