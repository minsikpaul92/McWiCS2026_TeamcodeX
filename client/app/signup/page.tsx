"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  // 1. THE MEMORY: Initializing the state with all fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    email: "",
    password: "",
  });

  // 2. THE AUTO-LOAD: When page opens, check for saved data
  useEffect(() => {
    const saved = localStorage.getItem("user_signup_draft");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // 3. THE AUTO-SAVE: Save to storage every time something is typed
  useEffect(() => {
    localStorage.setItem("user_signup_draft", JSON.stringify(formData));
  }, [formData]);

  // 4. THE CAPTURER: Updates the state object
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // const handleSignUp = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log("Ready to send to backend:", formData);

  //   // Move to onboarding
  //   router.push("/onboarding");
  // };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // This 'talks' to the Python server running on your friend's machine
      const response = await fetch("http://localhost:8000/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // Sends your JSON data
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Success:", result.message);

        // --- AUTO-LOGIN LOGIC ---
        const userSession = {
          id: result.db_id,
          firstName: formData.firstName,
          email: formData.email
        };

        localStorage.setItem("user_db_id", result.db_id);
        localStorage.setItem("user_first_name", formData.firstName);
        localStorage.setItem("user_session", JSON.stringify(userSession));

        console.log("✅ Auto-logged in and saved session to localStorage");

        localStorage.removeItem("user_signup_draft");
        router.push("/onboarding");
      } else {
        alert(result.detail || "Signup failed");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Make sure the Python backend is running!");
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
            Join IntroConnect at your own pace.
          </p>
        </div>

        {/* Google Login Button from Commit 1 */}
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
          Continue with Google
        </button>

        {/* Divider from Commit 1 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-space-grotesk">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
              <input
                id="firstName" type="text" required
                value={formData.firstName} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
              <input
                id="lastName" type="text" required
                value={formData.lastName} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Gender & Age Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="gender">
                Gender <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <select
                id="gender"
                value={formData.gender} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary appearance-none"
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
                id="age" type="number"
                value={formData.age} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
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