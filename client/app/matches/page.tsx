"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User, MessageCircle, Heart } from "lucide-react"

// Define what a "Match" looks like
interface Match {
  id: string
  name: string
  bio: string
  interests: string[]
  match_score: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleSayHi = (match: Match) => {
    // Store in localStorage for Home page to pick up
    localStorage.setItem("current_match_trial", JSON.stringify(match));
    router.push("/dashboard");
  };

  useEffect(() => {
    const dbId = localStorage.getItem("user_db_id");
    const session = localStorage.getItem("user_session");

    // Route Guard
    if (!session || !dbId) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:8000/matching/list/${dbId}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching matches:", err);
        setMatches([]);
        setLoading(false);
      });
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-xl font-space-grotesk">Finding your kindred spirits...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold font-space-grotesk">Your Matches</h1>
          <p className="text-muted-foreground">Based on your shared love for quiet spaces and deep talks.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="text-primary h-6 w-6" />
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                  {match.match_score}% Match
                </span>
              </div>

              <h3 className="text-xl font-bold mb-1">{match.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{match.bio}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {match.interests.map(interest => (
                  <span key={interest} className="text-[10px] uppercase tracking-wider border border-border px-2 py-1 rounded">
                    {interest}
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSayHi(match)}
                  className="flex-1 gap-2 rounded-full"
                >
                  <MessageCircle size={16} /> Say Hi
                </Button>
                <Button variant="outline" className="rounded-full px-3">
                  <Heart size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}