"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type AlertProfile = { latitude: number | null; longitude: number | null; radius_miles: number; categories: string[]; browser_alerts: boolean };
type NewJob = { title: string; business_name: string; category: string; latitude: number; longitude: number };

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function JobAlertListener() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;
    const supabase = createClient();
    let profile: AlertProfile | null = null;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const result = await supabase.from("profiles").select("latitude, longitude, radius_miles, categories, browser_alerts").eq("id", data.user.id).maybeSingle();
      profile = result.data;
    });
    const channel = supabase.channel("nearby-job-alerts").on("postgres_changes", { event: "INSERT", schema: "public", table: "jobs" }, ({ new: row }) => {
      const job = row as NewJob;
      if (!profile?.browser_alerts || Notification.permission !== "granted" || profile.latitude == null || profile.longitude == null) return;
      const categoryMatch = profile.categories.length === 0 || profile.categories.some((item) => item.toLowerCase() === job.category.toLowerCase());
      const nearby = milesBetween(profile.latitude, profile.longitude, job.latitude, job.longitude) <= profile.radius_miles;
      if (categoryMatch && nearby) new Notification(`New Cardabl job: ${job.title}`, { body: `${job.business_name} needs help near you.`, icon: "/favicon.svg", tag: `cardabl-${job.title}` });
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  return null;
}
