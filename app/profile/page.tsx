"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Building2, Landmark, LocateFixed, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Profile = { display_name?: string; phone?: string; role?: string; postal_code?: string; latitude?: number | null; longitude?: number | null; radius_miles?: number; categories?: string[]; browser_alerts?: boolean; email_alerts?: boolean };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ role: "worker", radius_miles: 10, categories: [], browser_alerts: true, email_alerts: true });
  const [message, setMessage] = useState("Loading your profile…");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!configured) return setMessage("Connect Supabase to activate accounts and alerts.");
    fetch("/api/profile").then(async (response) => {
      if (response.status === 401) return location.href = "/account";
      const data = await response.json();
      if (data.profile) setProfile((current) => ({ ...current, ...data.profile }));
      setMessage("");
    }).catch(() => setMessage("Could not load your profile."));
  }, [configured]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving…");
    const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
    setMessage(response.ok ? "Profile and job alerts saved." : (await response.json()).error || "Could not save.");
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setProfile({ ...profile, latitude: coords.latitude, longitude: coords.longitude });
      setMessage("Location added. Save your profile to use it for nearby alerts.");
    }, () => setMessage("Location permission was not allowed."));
  }

  async function enableAlerts() {
    if (!("Notification" in window)) return setMessage("Browser notifications are unavailable on this device.");
    const permission = await Notification.requestPermission();
    setProfile({ ...profile, browser_alerts: permission === "granted" });
    setMessage(permission === "granted" ? "Browser job alerts enabled. Save your profile." : "Notification permission was not granted.");
  }

  return <main className="min-h-screen bg-[#07110e] px-4 py-8 text-white"><div className="mx-auto max-w-3xl">
    <div className="flex items-center justify-between"><Link href="/" className="font-black text-[#baff29]">cardabl</Link><button onClick={async () => { if (configured) await createClient().auth.signOut(); location.href = "/"; }} className="text-sm font-bold text-white/60">Sign out</button></div>
    <div className="mt-6 rounded-[2rem] bg-[#f7faf8] p-6 text-[#07110e] sm:p-8"><p className="text-sm font-black uppercase text-[#35705a]">Account & alerts</p><h1 className="mt-2 text-3xl font-black">Your Cardabl profile</h1>
      <form onSubmit={save} className="mt-7 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2"><div><Label>Name or business name</Label><Input className="mt-2" value={profile.display_name || ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} required /></div><div><Label>Mobile number</Label><Input className="mt-2" type="tel" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div></div>
        <div><Label>I use Cardabl as</Label><div className="mt-2 grid grid-cols-2 gap-3">{[["worker", UserRound, "Worker"], ["business", Building2, "Business"]].map(([value, Icon, label]) => <button key={String(value)} type="button" onClick={() => setProfile({ ...profile, role: String(value) })} className={`flex items-center gap-2 rounded-xl border p-3 font-bold ${profile.role === value ? "border-[#184b39] bg-[#e8f4ee]" : "border-[#d6e3dc]"}`}><Icon className="size-5" />{String(label)}</button>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><div><Label>ZIP code</Label><Input className="mt-2" inputMode="numeric" value={profile.postal_code || ""} onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })} /></div><Button type="button" variant="outline" onClick={locate} className="self-end"><LocateFixed className="size-4" /> Use current location</Button></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label>Job alert radius</Label><NativeSelect className="mt-2" value={profile.radius_miles} onChange={(e) => setProfile({ ...profile, radius_miles: Number(e.target.value) })}><option value="5">Within 5 miles</option><option value="10">Within 10 miles</option></NativeSelect></div><div><Label>Job categories</Label><Input className="mt-2" placeholder="Retail, Events, Food service" value={(profile.categories || []).join(", ")} onChange={(e) => setProfile({ ...profile, categories: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} /></div></div>
        <div className="rounded-2xl bg-[#e8f4ee] p-4"><div className="flex items-center gap-2 font-black"><BellRing className="size-5" /> Notifications</div><label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={profile.email_alerts} onChange={(e) => setProfile({ ...profile, email_alerts: e.target.checked })} /> Email me matching jobs</label><label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={profile.browser_alerts} onChange={(e) => setProfile({ ...profile, browser_alerts: e.target.checked })} /> Browser/PWA alerts</label><Button type="button" variant="outline" onClick={enableAlerts} className="mt-4">Enable browser alerts</Button></div>
        {profile.role === "worker" && <div className="rounded-2xl border border-[#d6e3dc] p-4"><div className="flex items-center gap-2 font-black"><Landmark className="size-5" /> Secure payout account</div><p className="mt-1 text-sm text-[#587068]">Stripe Connect securely collects identity and bank payout details. Cardabl never stores full account numbers.</p><Button type="button" onClick={async () => { const response = await fetch("/api/stripe/connect", { method: "POST" }); const data = await response.json(); if (data.url) location.href = data.url; else setMessage(data.error); }} className="mt-4 bg-[#07110e] text-white">Connect bank or debit card</Button></div>}
        <Button className="h-12 w-full bg-[#baff29] font-black text-[#07110e] hover:bg-[#d0ff68]">Save profile</Button>
      </form>{message && <p className="mt-4 rounded-xl bg-white p-3 text-sm shadow-sm">{message}</p>}
    </div></div></main>;
}
