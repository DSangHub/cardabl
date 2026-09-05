"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Clock3, CreditCard, LocateFixed, MapPin, Navigation, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Job = { id: number; title: string; business: string; distance: number; starts: string; duration: number; category: string };
const seedJobs: Job[] = [
  { id: 1, title: "Event setup helper", business: "Fig Garden Events", distance: 2.1, starts: "20 min", duration: 4, category: "Events" },
  { id: 2, title: "Stockroom organizer", business: "Local Market", distance: 4.7, starts: "45 min", duration: 5, category: "Retail" },
  { id: 3, title: "Lunch rush support", business: "Main Street Grill", distance: 6.3, starts: "1 hr", duration: 3, category: "Food service" },
];

export default function Home() {
  const [radius, setRadius] = useState(10);
  const [jobs, setJobs] = useState(seedJobs);
  const [location, setLocation] = useState("Fresno, CA");
  const [claimed, setClaimed] = useState<number | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [notice, setNotice] = useState("");
  const visible = useMemo(() => jobs.filter((job) => job.distance <= radius), [jobs, radius]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, []);

  function useLocation() {
    if (!navigator.geolocation) return setNotice("Location is not available on this device.");
    setNotice("Finding nearby work…");
    navigator.geolocation.getCurrentPosition(
      () => { setLocation("Current location"); setNotice("Showing work near you."); },
      () => setNotice("Location access was not allowed. You can still choose a 5 or 10 mile area."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function submitJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "Urgent local help");
    const duration = Number(data.get("duration") || 4);
    setJobs((current) => [{ id: Date.now(), title, business: "Your business", distance: 1.4, starts: "20 min", duration, category: "New" }, ...current]);
    setShowPost(false);
    setNotice("Your urgent job is ready for nearby workers. Connect payment to publish it live.");
  }

  return (
    <main className="min-h-screen bg-[#07110e] text-[#f6fbf8]">
      <header className="border-b border-white/10 bg-[#07110e]/95 px-4 py-4 backdrop-blur sm:px-7"><div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#baff29] font-black text-[#07110e]">C</span><div><div className="text-xl font-black tracking-tight">cardabl</div><div className="text-xs text-white/55">local work, right now</div></div></div>
        <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/10">Sign in</button>
      </div></header>

      <section className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-7 lg:grid-cols-[1.1fr_.9fr] lg:py-11">
        <div><div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#baff29]"><Sparkles className="size-4" /> Jobs can start in as little as 20 minutes</div>
          <h1 className="max-w-2xl text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-6xl">Need work—or help—right now?</h1>
          <p className="mt-5 max-w-xl text-lg leading-7 text-white/65">Cardabl matches local businesses with nearby people for urgent, entry-level shifts listed at <strong className="text-white">$25 an hour</strong>.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button size="lg" className="h-14 rounded-2xl bg-[#baff29] text-base font-black text-[#07110e] hover:bg-[#d0ff68]" onClick={() => document.getElementById("nearby")?.scrollIntoView({ behavior: "smooth" })}><Navigation className="size-5" /> Find a job</Button>
            <Dialog open={showPost} onOpenChange={setShowPost}><DialogTrigger asChild><Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/20 bg-white/5 text-base font-black text-white hover:bg-white/10 hover:text-white"><BriefcaseBusiness className="size-5" /> Post urgent help</Button></DialogTrigger>
              <DialogContent className="border-[#d6e3dc] bg-[#f7faf8] text-[#07110e] sm:max-w-md"><DialogHeader><DialogTitle className="text-2xl font-black">Post urgent help</DialogTitle><DialogDescription>Reach available workers within 5–10 miles. All shifts are set at $25/hour.</DialogDescription></DialogHeader>
                <form className="mt-2 space-y-4" onSubmit={submitJob}><div className="space-y-2"><Label htmlFor="title">What do you need help with?</Label><Input id="title" name="title" required placeholder="Example: Stock shelves" /></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="starts">Start time</Label><NativeSelect id="starts" name="starts" defaultValue="20"><option value="20">In 20 minutes</option><option value="45">In 45 minutes</option><option value="60">In 1 hour</option></NativeSelect></div><div className="space-y-2"><Label htmlFor="duration">Hours needed</Label><NativeSelect id="duration" name="duration" defaultValue="4"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>8</option></NativeSelect></div></div>
                  <div className="rounded-xl bg-[#e8f4ee] p-3 text-sm leading-6"><div className="flex justify-between"><span>Worker rate</span><strong>$25/hour</strong></div><div className="flex justify-between"><span>Business fee</span><strong>$1/hour</strong></div><div className="mt-2 flex justify-between border-t border-[#cbded4] pt-2"><span>Total for 4 hours</span><strong>$104</strong></div></div><Button className="h-12 w-full bg-[#07110e] font-bold text-white">Continue to payment</Button>
                </form></DialogContent>
            </Dialog>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/55"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#baff29]" /> Verified profiles</span><span className="flex items-center gap-2"><CreditCard className="size-4 text-[#baff29]" /> Secure card payment</span><span>1099 independent work</span></div>
        </div>
        <aside className="relative overflow-hidden rounded-[2rem] bg-[#eff7f2] p-5 text-[#07110e] shadow-2xl shadow-black/30 sm:p-7"><div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#baff29]/35 blur-3xl" />
          <div className="relative flex items-center justify-between"><div><p className="text-sm font-bold text-[#426056]">WORKER TAKE-HOME</p><p className="mt-1 text-5xl font-black tracking-tight">$24<span className="text-xl">/hr</span></p><p className="mt-1 text-sm text-[#587068]">$25 rate − $1 Cardabl fee</p></div><WalletCards className="size-12 text-[#184b39]" /></div>
          <div className="relative mt-7 rounded-2xl bg-white p-4 shadow-sm"><p className="font-black">Card your pay</p><p className="mt-1 text-sm leading-6 text-[#587068]">Choose an eligible card or bank account on file as your payout destination.</p><div className="mt-4 flex gap-2"><span className="rounded-lg border border-[#d9e5df] px-3 py-2 text-xs font-bold">Debit card</span><span className="rounded-lg border border-[#d9e5df] px-3 py-2 text-xs font-bold">Bank account</span></div></div>
          <p className="relative mt-4 text-xs leading-5 text-[#62766f]">Payout availability and timing depend on identity verification, the card issuer, and the connected payment provider.</p>
        </aside>
      </section>

      <section id="nearby" className="border-t border-white/10 bg-[#0b1915] px-4 py-8 sm:px-7"><div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[#baff29]">AVAILABLE NOW</p><h2 className="mt-1 text-3xl font-black">Urgent jobs nearby</h2></div><div className="flex gap-2"><button onClick={useLocation} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold"><LocateFixed className="size-4" /> {location}</button><div className="flex rounded-xl bg-white/10 p-1">{[5, 10].map((value) => <button key={value} onClick={() => setRadius(value)} className={`rounded-lg px-3 py-1 text-sm font-bold ${radius === value ? "bg-white text-[#07110e]" : "text-white/60"}`}>{value} mi</button>)}</div></div></div>
        {notice && <div className="mt-4 flex items-center justify-between rounded-xl bg-[#baff29]/10 px-4 py-3 text-sm text-[#dfff9b]"><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice("")}><X className="size-4" /></button></div>}
        <div className="mt-5 grid gap-3 lg:grid-cols-3">{visible.map((job) => <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[.055] p-5 transition hover:-translate-y-1 hover:border-[#baff29]/50"><div className="flex items-center justify-between"><span className="rounded-full bg-[#baff29]/15 px-3 py-1 text-xs font-bold text-[#dfff9b]">{job.category}</span><span className="flex items-center gap-1 text-sm text-white/55"><MapPin className="size-4" /> {job.distance} mi</span></div><h3 className="mt-5 text-xl font-black">{job.title}</h3><p className="mt-1 text-sm text-white/55">{job.business}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><div><p className="text-lg font-black">${job.duration * 25}</p><p className="flex items-center gap-1 text-xs text-white/45"><Clock3 className="size-3" /> {job.duration} hrs · starts {job.starts}</p></div><Button onClick={() => setClaimed(job.id)} disabled={claimed === job.id} className="rounded-xl bg-white font-black text-[#07110e] hover:bg-[#baff29]">{claimed === job.id ? "Claimed" : "Claim shift"}</Button></div></article>)}</div>
      </div></section>
      <footer className="border-t border-white/10 bg-[#07110e] px-4 py-6 text-center text-sm text-white/45">Business pays $26/hour. Worker receives $24/hour. Cardabl retains $2/hour before Stripe processing fees. Worker classification, screening, insurance, and local labor rules must be verified before launch.</footer>
    </main>
  );
}
