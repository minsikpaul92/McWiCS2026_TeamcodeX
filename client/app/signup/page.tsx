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
    const response = await fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData), // Sends your JSON data
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Success:", result.message);
      // Clean up the local storage draft since it's now safe in the cloud
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an Account</h1>
          <p className="text-muted-foreground mt-2">Join IntroConnect at your own pace.</p>
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
              <label className="text-sm font-medium" htmlFor="gender">Gender</label>
              <select 
                id="gender" 
                value={formData.gender} onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="age">Age</label>
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
          <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}