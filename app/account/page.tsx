"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [message, setMessage] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return setMessage("Account service is awaiting Supabase environment variables.");
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email"));
    const password = String(values.get("password"));
    const supabase = createClient();
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/profile` } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm your account.");
    location.href = "/profile";
  }

  return <main className="min-h-screen bg-[#07110e] px-4 py-10 text-white"><div className="mx-auto max-w-md">
    <Link href="/" className="text-sm font-bold text-[#baff29]">← Cardabl home</Link>
    <div className="mt-6 rounded-[2rem] bg-[#f7faf8] p-7 text-[#07110e]">
      <p className="text-sm font-black uppercase text-[#35705a]">Job alerts start here</p>
      <h1 className="mt-2 text-3xl font-black">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm leading-6 text-[#587068]">Save your location, choose a 5 or 10 mile radius, and get notified when urgent jobs match.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label htmlFor="email">Email</Label><Input className="mt-2" id="email" name="email" type="email" required /></div>
        <div><Label htmlFor="password">Password</Label><Input className="mt-2" id="password" name="password" type="password" minLength={8} required /></div>
        <Button className="h-12 w-full bg-[#07110e] text-white">{mode === "signup" ? "Create account" : "Sign in"}</Button>
      </form>
      {message && <p className="mt-4 rounded-xl bg-[#e8f4ee] p-3 text-sm">{message}</p>}
      <button className="mt-5 w-full text-sm font-bold text-[#35705a]" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "New to Cardabl? Create an account"}</button>
    </div>
  </div></main>;
}
