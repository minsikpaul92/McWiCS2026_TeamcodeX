"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("user_signup_draft");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("user_signup_draft", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;

    // PREVENT NEGATIVE AGE: 
    // If the field is 'age', ensure the value isn't less than 0
    if (id === "age" && parseInt(value) < 0) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const targetUrl = `${BACKEND_URL}/users/signup`;
      console.log("Attempting Signup to:", targetUrl);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // ... (existing success logic)
        localStorage.setItem("user_db_id", result.db_id);
        localStorage.setItem("user_first_name", formData.firstName);
        localStorage.setItem("user_session", JSON.stringify({
          id: result.db_id,
          firstName: formData.firstName,
          email: formData.email
        }));
        localStorage.removeItem("user_signup_draft");
        router.push("/onboarding");
      } else {
        alert(`Server Error (${response.status}): ${result.detail || "Signup failed"}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert(`Connection failed to: ${BACKEND_URL}
1. Check Vercel Backend Logs.
2. Error details: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md space-y-6 p-8 border border-border rounded-2xl bg-card/50 backdrop-blur-sm shadow-xl">

        <div className="text-center">
          <h1 className="text-3xl font-bold font-space-grotesk tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="text-muted-foreground mt-2">
            Join Quietly at your own pace.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
              <input
                id="firstName" type="text" required
                value={formData.firstName} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
              <input
                id="lastName" type="text" required
                value={formData.lastName} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="gender">
                Gender <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <select
                id="gender"
                value={formData.gender} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary appearance-none text-foreground"
              >
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="age">
                Age <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <input
                id="age"
                type="number"
                min="0" // HTML5 browser-level prevention
                value={formData.age}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 mt-4 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
          >
            Next
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}