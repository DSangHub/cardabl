"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, Clock3, CreditCard, DollarSign, Languages, LocateFixed, MapPin, Navigation, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatCents, getStatePayRate, type StatePayRate } from "@/lib/state-pay-rates";

type Job = { id: number; title: string; titleEs: string; business: string; distance: number; starts: string; startsEs: string; duration: number; category: string; categoryEs: string };
const seedJobs: Job[] = [
  { id: 1, title: "Event setup helper", titleEs: "Ayudante para preparar eventos", business: "Fig Garden Events", distance: 2.1, starts: "20 min", startsEs: "20 min", duration: 4, category: "Events", categoryEs: "Eventos" },
  { id: 2, title: "Stockroom organizer", titleEs: "Organizador de almacén", business: "Local Market", distance: 4.7, starts: "45 min", startsEs: "45 min", duration: 5, category: "Retail", categoryEs: "Ventas" },
  { id: 3, title: "Lunch rush support", titleEs: "Apoyo durante la hora del almuerzo", business: "Main Street Grill", distance: 6.3, starts: "1 hr", startsEs: "1 hora", duration: 3, category: "Food service", categoryEs: "Comida" },
];

export default function Home() {
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [radius, setRadius] = useState(10);
  const [jobs] = useState(seedJobs);
  const [location, setLocation] = useState("Fresno, CA");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [payRate, setPayRate] = useState<StatePayRate>(() => getStatePayRate("CA")!);
  const [postDuration, setPostDuration] = useState(4);
  const [claimed, setClaimed] = useState<number | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedCard, setSelectedCard] = useState("Home Depot");
  const [addingCard, setAddingCard] = useState(false);
  const [customCard, setCustomCard] = useState("");
  const visible = useMemo(() => jobs.filter((job) => job.distance <= radius), [jobs, radius]);
  const today = new Date().getDay();
  const promotionalCashBack = today === 1 || today === 2 ? 5 : today >= 3 && today <= 5 ? 3 : 2;
  const isSpanish = language === "es";
  const t = (english: string, spanish: string) => isSpanish ? spanish : english;
  useEffect(() => {
    const languageFrame = requestAnimationFrame(() => {
      const savedLanguage = localStorage.getItem("cardabl-language");
      if (savedLanguage === "es") {
        setLanguage("es");
        document.documentElement.lang = "es";
      }
    });
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => cancelAnimationFrame(languageFrame);
  }, []);

  function toggleLanguage() {
    const nextLanguage = language === "en" ? "es" : "en";
    setLanguage(nextLanguage);
    localStorage.setItem("cardabl-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    setNotice(nextLanguage === "es" ? "CardAbl ahora está en español." : "CardAbl is now in English.");
  }

  function useLocation() {
    if (!navigator.geolocation) return setNotice(t("Location is not available on this device.", "La ubicación no está disponible en este dispositivo."));
    setNotice(t("Finding your state and local pay rate…", "Buscando su estado y la tarifa local…"));
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`/api/location/state?latitude=${encodeURIComponent(coords.latitude)}&longitude=${encodeURIComponent(coords.longitude)}`);
          const result = await response.json() as StatePayRate & { error?: string };
          if (!response.ok) throw new Error(t("Your state could not be identified.", "No se pudo identificar su estado."));
          setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
          setPayRate(result);
          setLocation(`${result.stateName}, ${result.stateCode}`);
          setNotice(isSpanish ? `${result.stateName} ocupa el puesto #${result.rank} por ingresos. Los trabajos aquí pagan ${formatCents(result.listedRateCents)} por hora.` : `${result.stateName} is income rank #${result.rank}. Jobs here are listed at ${formatCents(result.listedRateCents)}/hour.`);
        } catch (error) {
          setNotice(error instanceof Error ? error.message : t("Your state could not be identified.", "No se pudo identificar su estado."));
        }
      },
      () => setNotice(t("Location access was not allowed. You can still choose a 5 or 10 mile area.", "No se permitió el acceso a la ubicación. Aún puede elegir un área de 5 o 10 millas.")),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submitJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "Urgent local help");
    const duration = Number(data.get("duration") || 4);
    if (!coordinates) {
      setNotice(t("Use your location first so Cardabl can verify the correct state rate.", "Primero use su ubicación para que CardAbl verifique la tarifa correcta de su estado."));
      setShowPost(false);
      document.getElementById("nearby")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const jobId = crypto.randomUUID();
    setNotice(t("Opening secure payment…", "Abriendo el pago seguro…"));
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, title, durationHours: duration, ...coordinates }),
    });
    const result = await response.json();
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setNotice(result.error || t("Secure payment could not be opened. Please try again.", "No se pudo abrir el pago seguro. Inténtelo de nuevo."));
    setShowPost(false);
  }

  function choosePaymentMethod(method: string) {
    if (method === "Apple Pay" || method === "Google Pay") {
      setNotice(isSpanish ? `${method} aparece en el pago seguro cuando el negocio, el dispositivo y la cuenta de Stripe son elegibles.` : `${method} appears in secure checkout when the business, device and Stripe account are eligible.`);
      setShowPost(true);
      return;
    }
    setNotice(isSpanish ? `${method} necesita una conexión autorizada y todavía no está disponible.` : `${method} needs an authorized partner connection and is not available yet.`);
    document.getElementById("nearby")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#07110e] text-[#f6fbf8]">
      <header className="border-b border-white/10 bg-[#07110e]/95 px-4 py-4 backdrop-blur sm:px-7"><div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="block shrink-0" aria-label={t("CardAbl home", "Inicio de CardAbl")}><Image src="/cardabl-logo.svg" alt={t("CardAbl — local work, right now", "CardAbl — trabajo local, ahora mismo")} width={300} height={88} priority className="h-10 w-auto sm:h-14" /></Link>
        <div className="flex items-center gap-2 sm:gap-3"><button type="button" onClick={toggleLanguage} className="flex items-center gap-1.5 rounded-full border border-[#baff29]/50 px-3 py-2 text-xs font-black text-[#dfff9b] hover:bg-white/10" aria-label={t("Cambiar a español", "Switch to English")}><Languages className="size-4" />{isSpanish ? "EN" : "ES"}</button><a href="https://cardabl.app" className="hidden items-center gap-2 rounded-xl border border-white/15 bg-white px-2 py-1.5 text-[#07110e] md:flex" aria-label={t("Scan QR code to open cardabl.app", "Escanee el código QR para abrir cardabl.app")}><Image src="/cardabl-qr.svg" alt={t("QR code for cardabl.app", "Código QR de cardabl.app")} width={44} height={44} className="size-11" /><span className="pr-1 text-xs font-black leading-4">{t("SCAN", "ESCANEAR")}<br /><span className="text-[#35705a]">cardabl.app</span></span></a><Link href="/account" className="rounded-full border border-white/15 px-3 py-2 text-sm font-bold hover:bg-white/10 sm:px-4"><span className="sm:hidden">{t("Account", "Cuenta")}</span><span className="hidden sm:inline">{t("Sign in / Create account", "Ingresar / Crear cuenta")}</span></Link></div>
      </div></header>

      <section className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-7 lg:grid-cols-[1.1fr_.9fr] lg:py-11">
        <div><div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#baff29]"><Sparkles className="size-4" /> {t("Jobs can start in as little as 20 minutes", "Los trabajos pueden comenzar en solo 20 minutos")}</div>
          <h1 className="max-w-2xl text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-6xl">{t("Need work—or help—right now?", "¿Necesita trabajo—o ayuda—ahora mismo?")}</h1>
          <p className="mt-5 max-w-xl text-lg leading-7 text-white/65">{t("CardAbl matches local businesses with nearby people for urgent, entry-level shifts. Your state’s current listed rate is", "CardAbl conecta negocios locales con personas cercanas para turnos urgentes de nivel inicial. La tarifa actual de su estado es")} <strong className="text-white">{formatCents(payRate.listedRateCents)} {t("an hour", "por hora")}</strong>.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button size="lg" className="h-14 rounded-2xl bg-[#baff29] text-base font-black text-[#07110e] hover:bg-[#d0ff68]" onClick={() => document.getElementById("nearby")?.scrollIntoView({ behavior: "smooth" })}><Navigation className="size-5" /> {t("Find a job", "Buscar trabajo")}</Button>
            <Dialog open={showPost} onOpenChange={setShowPost}><DialogTrigger asChild><Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/20 bg-white/5 text-base font-black text-white hover:bg-white/10 hover:text-white"><BriefcaseBusiness className="size-5" /> {t("Post urgent help", "Publicar ayuda urgente")}</Button></DialogTrigger>
              <DialogContent className="border-[#d6e3dc] bg-[#f7faf8] text-[#07110e] sm:max-w-md"><DialogHeader><DialogTitle className="text-2xl font-black">{t("Post urgent help", "Publicar ayuda urgente")}</DialogTitle><DialogDescription>{isSpanish ? `Llegue a trabajadores disponibles dentro de 5–10 millas. Los turnos en ${payRate.stateName} pagan ${formatCents(payRate.listedRateCents)} por hora.` : `Reach available workers within 5–10 miles. ${payRate.stateName} shifts are listed at ${formatCents(payRate.listedRateCents)}/hour.`}</DialogDescription></DialogHeader>
                <form className="mt-2 space-y-4" onSubmit={submitJob}><div className="space-y-2"><Label htmlFor="title">{t("What do you need help with?", "¿Con qué necesita ayuda?")}</Label><Input id="title" name="title" required placeholder={t("Example: Stock shelves", "Ejemplo: Surtir estantes")} /></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="starts">{t("Start time", "Hora de inicio")}</Label><NativeSelect id="starts" name="starts" defaultValue="20"><option value="20">{t("In 20 minutes", "En 20 minutos")}</option><option value="45">{t("In 45 minutes", "En 45 minutos")}</option><option value="60">{t("In 1 hour", "En 1 hora")}</option></NativeSelect></div><div className="space-y-2"><Label htmlFor="duration">{t("Hours needed", "Horas necesarias")}</Label><NativeSelect id="duration" name="duration" value={postDuration} onChange={(event) => setPostDuration(Number(event.target.value))}><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>8</option></NativeSelect></div></div>
                  <div className="rounded-xl bg-[#e8f4ee] p-3 text-sm leading-6"><div className="flex justify-between"><span>{t("Listed worker rate", "Tarifa publicada")}</span><strong>{formatCents(payRate.listedRateCents)}/{t("hour", "hora")}</strong></div><div className="flex justify-between"><span>{t("Business fee", "Cargo al negocio")}</span><strong>$1/{t("hour", "hora")}</strong></div><div className="mt-2 flex justify-between border-t border-[#cbded4] pt-2"><span>{t(`Total for ${postDuration} hours`, `Total por ${postDuration} horas`)}</span><strong>{formatCents(payRate.businessRateCents * postDuration)}</strong></div></div><Button className="h-12 w-full bg-[#07110e] font-bold text-white">{t("Continue to payment", "Continuar al pago")}</Button>
                </form></DialogContent>
            </Dialog>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/55"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#baff29]" /> {t("Verified profiles", "Perfiles verificados")}</span><span className="flex items-center gap-2"><CreditCard className="size-4 text-[#baff29]" /> {t("Secure card payment", "Pago seguro con tarjeta")}</span><span>{t("1099 independent work", "Trabajo independiente 1099")}</span></div>
        </div>
        <aside className="relative overflow-hidden rounded-[2rem] bg-[#eff7f2] p-5 text-[#07110e] shadow-2xl shadow-black/30 sm:p-7"><div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#baff29]/35 blur-3xl" />
          <div className="relative flex items-center justify-between"><div><p className="text-sm font-bold text-[#426056]">{t("WORKER TAKE-HOME", "PAGO NETO DEL TRABAJADOR")}</p><p className="mt-1 text-5xl font-black tracking-tight">{formatCents(payRate.workerRateCents)}<span className="text-xl">/{t("hr", "h")}</span></p><p className="mt-1 text-sm text-[#587068]">{formatCents(payRate.listedRateCents)} {t("rate", "tarifa")} − $1 {t("CardAbl fee", "cargo de CardAbl")}</p><p className="mt-1 text-xs font-bold text-[#35705a]">{payRate.stateName} · {t("income rank", "puesto de ingresos")} #{payRate.rank}</p></div><WalletCards className="size-12 text-[#184b39]" /></div>
          <div className="relative mt-7 rounded-2xl bg-white p-4 shadow-sm"><p className="font-black">{t("Choose where you get paid", "Elija dónde recibir su pago")}</p><p className="mt-1 text-sm leading-6 text-[#587068]">{t("Send earnings to an eligible debit card or bank account.", "Envíe sus ganancias a una tarjeta de débito o cuenta bancaria elegible.")}</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/profile#payout" className="rounded-lg border border-[#b9d2c6] bg-[#f4faf7] px-3 py-2 text-xs font-bold transition hover:border-[#184b39] hover:bg-[#e8f4ee]">{t("Connect debit card", "Conectar tarjeta de débito")}</Link><Link href="/profile#payout" className="rounded-lg border border-[#b9d2c6] bg-[#f4faf7] px-3 py-2 text-xs font-bold transition hover:border-[#184b39] hover:bg-[#e8f4ee]">{t("Connect bank account", "Conectar cuenta bancaria")}</Link></div></div>
          <div className="relative mt-4 rounded-2xl border border-[#d6e3dc] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3"><div><p className="font-black">{t("Payment options", "Opciones de pago")}</p><p className="mt-1 text-sm leading-5 text-[#587068]">{t("Available methods appear securely at checkout.", "Los métodos disponibles aparecen de forma segura al pagar.")}</p></div><span className="rounded-full bg-[#e8f4ee] px-3 py-1 text-xs font-bold text-[#184b39]">{t("Powered by Stripe", "Procesado por Stripe")}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2">{["Apple Pay", "Google Pay"].map((method) => <button key={method} type="button" onClick={() => choosePaymentMethod(method)} className="rounded-xl border border-[#b9d2c6] bg-[#f4faf7] px-3 py-2 text-left transition hover:border-[#184b39] hover:bg-[#e8f4ee]"><span className="block text-sm font-black">{method}</span><span className="mt-0.5 block text-xs font-bold text-[#35705a]">{t("Continue to checkout", "Continuar al pago")}</span></button>)}{["Venmo", "Zelle", "Walmart Pay", "Samsung Pay"].map((method) => <button key={method} type="button" onClick={() => choosePaymentMethod(method)} className="rounded-xl border border-[#e2e6e3] bg-[#f7f8f7] px-3 py-2 text-left transition hover:border-[#b9d2c6] hover:bg-[#eef5f1]"><span className="block text-sm font-black text-[#52645d]">{method}</span><span className="mt-0.5 block text-xs font-bold text-[#7d8c86]">{t("Check availability", "Ver disponibilidad")}</span></button>)}</div>
            <p className="mt-3 text-xs leading-5 text-[#62766f]">{t("Apple Pay and Google Pay display when the customer, device and Stripe account are eligible. Other services activate only after CardAbl connects their authorized payment partner.", "Apple Pay y Google Pay aparecen cuando el cliente, el dispositivo y la cuenta de Stripe son elegibles. Otros servicios se activan solamente después de que CardAbl conecte a su socio de pagos autorizado.")}</p>
          </div>
          <div className="relative mt-4 rounded-2xl bg-[#0f2d23] p-4 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="font-black">{t("Link your favorite cards", "Vincule sus tarjetas favoritas")}</p><p className="mt-1 text-sm leading-5 text-white/65">{t("Get paid on CardAbl and earn promotional cash back at eligible stores.", "Reciba su pago en CardAbl y gane reembolsos promocionales en tiendas elegibles.")}</p></div><div className="shrink-0 rounded-xl bg-[#baff29] px-3 py-2 text-center text-[#07110e]"><span className="block text-[10px] font-bold uppercase">{t("Today", "Hoy")}</span><strong className="text-xl">{t("Up to", "Hasta")} {promotionalCashBack}%</strong></div></div>
            <div className="mt-4 grid grid-cols-2 gap-2">{["Home Depot", "Macy’s", "JCPenney", "Nordstrom Rack"].map((card) => <button key={card} type="button" onClick={() => setSelectedCard(card)} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${selectedCard === card ? "border-[#baff29] bg-[#baff29] text-[#07110e]" : "border-white/15 bg-white/5 text-white hover:border-white/35"}`}>{card}</button>)}</div>
            {addingCard ? <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (customCard.trim()) { setSelectedCard(customCard.trim()); setAddingCard(false); setCustomCard(""); } }}><Input aria-label={t("Card name", "Nombre de la tarjeta")} value={customCard} onChange={(event) => setCustomCard(event.target.value)} placeholder={t("Enter your favorite card", "Ingrese su tarjeta favorita")} className="border-white/20 bg-white text-[#07110e]" autoFocus /><Button className="bg-[#baff29] text-[#07110e] hover:bg-[#d0ff68]">{t("Add", "Agregar")}</Button></form> : <button type="button" onClick={() => setAddingCard(true)} className="mt-2 w-full rounded-xl border border-dashed border-white/30 px-3 py-2 text-sm font-bold text-[#dfff9b] hover:bg-white/5">{t("Don’t see your favorite card? Add it", "¿No ve su tarjeta favorita? Agréguela")}</button>}
            <p className="mt-3 text-xs leading-5 text-white/50">{t("Offers can change by store, day and time. Slow-day promotions may be higher on Mondays and Tuesdays, up to 5%. Terms and card eligibility apply.", "Las ofertas pueden cambiar según la tienda, el día y la hora. Las promociones de días lentos pueden ser mayores los lunes y martes, hasta un 5%. Aplican términos y elegibilidad de la tarjeta.")}</p>
          </div>
          <p className="relative mt-4 text-xs leading-5 text-[#62766f]">{t("Store cards are linked reward choices, not payout destinations unless their issuer supports payouts. Payout availability and timing depend on verification and the payment provider.", "Las tarjetas de tiendas son opciones de recompensas vinculadas, no destinos de pago, a menos que su emisor acepte pagos. La disponibilidad y el tiempo del pago dependen de la verificación y del proveedor.")}</p>
        </aside>
      </section>

      <section className="border-y border-[#d6e3dc] bg-[#eff7f2] px-4 py-10 text-[#07110e] sm:px-7">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#35705a]">{t("How your pay works", "Cómo funciona su pago")}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("Your money is not touched.", "Su dinero no se toca.")}</h2>
            <p className="mt-3 text-base leading-7 text-[#587068]">{t("CardAbl never withdraws money from your personal bank account. The business funds the job, and your approved earnings are securely routed to the payout account you choose.", "CardAbl nunca retira dinero de su cuenta bancaria personal. El negocio financia el trabajo y sus ganancias aprobadas se envían de forma segura a la cuenta de pago que usted elija.")}</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-[#baff29] font-black">1</span><h3 className="mt-4 text-lg font-black">{t("Complete the shift", "Complete el turno")}</h3><p className="mt-2 text-sm leading-6 text-[#587068]">{t("Clock in, do the posted work and finish the agreed shift.", "Registre su entrada, haga el trabajo publicado y termine el turno acordado.")}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-[#baff29] font-black">2</span><h3 className="mt-4 text-lg font-black">{t("Business approves it", "El negocio lo aprueba")}</h3><p className="mt-2 text-sm leading-6 text-[#587068]">{isSpanish ? `El negocio confirma las horas completadas. En ${payRate.stateName}, su pago neto actual es ${formatCents(payRate.workerRateCents)} por hora.` : `The business confirms the completed hours. In ${payRate.stateName}, your current take-home rate is ${formatCents(payRate.workerRateCents)} per hour.`}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-[#baff29] font-black">3</span><h3 className="mt-4 text-lg font-black">{t("Receive your earnings", "Reciba sus ganancias")}</h3><p className="mt-2 text-sm leading-6 text-[#587068]">{t("Stripe sends your earnings to your eligible bank account or debit card. Faster payout options may carry a clearly disclosed fee.", "Stripe envía sus ganancias a su cuenta bancaria o tarjeta de débito elegible. Las opciones de pago más rápido pueden incluir un cargo claramente indicado.")}</p></div>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-[#0f2d23] p-5 text-white sm:grid-cols-3">
            <span className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="size-5 text-[#baff29]" /> {t("No withdrawal from your account", "Sin retiros de su cuenta")}</span>
            <span className="flex items-center gap-2 text-sm font-bold"><DollarSign className="size-5 text-[#baff29]" /> {t("No hidden deduction", "Sin descuentos ocultos")}</span>
            <span className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-5 text-[#baff29]" /> {t("Bank details handled by Stripe", "Datos bancarios administrados por Stripe")}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#cbded4] bg-white p-4"><strong>{t("Ranks", "Puestos")} 1–10 · $25/{t("hr", "h")}</strong><p className="mt-1 text-xs text-[#62766f]">{t("Highest state per-capita income band", "Estados con mayores ingresos por persona")}</p></div><div className="rounded-xl border border-[#cbded4] bg-white p-4"><strong>{t("Ranks", "Puestos")} 11–25 · $20/{t("hr", "h")}</strong><p className="mt-1 text-xs text-[#62766f]">{t("Middle state income band", "Estados con ingresos medios")}</p></div><div className="rounded-xl border border-[#cbded4] bg-white p-4"><strong>{t("Ranks", "Puestos")} 26–50 · $18/{t("hr", "h")}</strong><p className="mt-1 text-xs text-[#62766f]">{t("Remaining states", "Demás estados")}</p></div></div>
          <p className="mt-4 text-xs leading-5 text-[#62766f]">{t("CardAbl uses the 2025 state per-capita personal-income ranking and deducts only the displayed $1-per-hour worker platform fee. Location verification sets the rate. The applicable state or local minimum wage controls if it is higher. Optional instant-payout fees, if selected, are shown before confirmation.", "CardAbl usa la clasificación estatal de ingresos personales por persona de 2025 y solo descuenta el cargo mostrado de $1 por hora al trabajador. La verificación de ubicación establece la tarifa. Se aplica el salario mínimo estatal o local si es mayor. Los cargos opcionales por pago instantáneo se muestran antes de confirmar.")}</p>
        </div>
      </section>

      <section id="nearby" className="border-t border-white/10 bg-[#0b1915] px-4 py-8 sm:px-7"><div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[#baff29]">{t("AVAILABLE NOW", "DISPONIBLE AHORA")}</p><h2 className="mt-1 text-3xl font-black">{t("Urgent jobs nearby", "Trabajos urgentes cercanos")}</h2></div><div className="flex gap-2"><button onClick={useLocation} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold"><LocateFixed className="size-4" /> {location}</button><div className="flex rounded-xl bg-white/10 p-1">{[5, 10].map((value) => <button key={value} onClick={() => setRadius(value)} className={`rounded-lg px-3 py-1 text-sm font-bold ${radius === value ? "bg-white text-[#07110e]" : "text-white/60"}`}>{value} mi</button>)}</div></div></div>
        {notice && <div className="mt-4 flex items-center justify-between rounded-xl bg-[#baff29]/10 px-4 py-3 text-sm text-[#dfff9b]"><span>{notice}</span><button aria-label={t("Dismiss", "Cerrar")} onClick={() => setNotice("")}><X className="size-4" /></button></div>}
        <div className="mt-5 grid gap-3 lg:grid-cols-3">{visible.map((job) => <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[.055] p-5 transition hover:-translate-y-1 hover:border-[#baff29]/50"><div className="flex items-center justify-between"><span className="rounded-full bg-[#baff29]/15 px-3 py-1 text-xs font-bold text-[#dfff9b]">{isSpanish ? job.categoryEs : job.category}</span><span className="flex items-center gap-1 text-sm text-white/55"><MapPin className="size-4" /> {job.distance} mi</span></div><h3 className="mt-5 text-xl font-black">{isSpanish ? job.titleEs : job.title}</h3><p className="mt-1 text-sm text-white/55">{job.business}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><div><p className="text-lg font-black">{formatCents(job.duration * payRate.listedRateCents)}</p><p className="flex items-center gap-1 text-xs text-white/45"><Clock3 className="size-3" /> {job.duration} {t("hrs", "h")} · {formatCents(payRate.listedRateCents)}/{t("hr", "h")} · {t("starts", "comienza")} {isSpanish ? job.startsEs : job.starts}</p></div><Button onClick={() => setClaimed(job.id)} disabled={claimed === job.id} className="rounded-xl bg-white font-black text-[#07110e] hover:bg-[#baff29]">{claimed === job.id ? t("Claimed", "Tomado") : t("Claim shift", "Tomar turno")}</Button></div></article>)}</div>
      </div></section>
      <footer className="border-t border-white/10 bg-[#07110e] px-4 py-6 text-center text-sm text-white/45">{isSpanish ? `En ${payRate.stateName}, el negocio paga ${formatCents(payRate.businessRateCents)} por hora y el trabajador recibe ${formatCents(payRate.workerRateCents)} por hora. CardAbl retiene $2 por hora antes de los cargos de procesamiento de Stripe. La clasificación del trabajador, verificación, seguro y reglas laborales estatales y locales deben verificarse antes del lanzamiento.` : `In ${payRate.stateName}, the business pays ${formatCents(payRate.businessRateCents)}/hour and the worker receives ${formatCents(payRate.workerRateCents)}/hour. CardAbl retains $2/hour before Stripe processing fees. Worker classification, screening, insurance, and state/local labor rules must be verified before launch.`}</footer>
    </main>
  );
}

