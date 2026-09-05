import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardabl — Local work, right now",
  description: "Find or fill urgent local shifts within 5–10 miles.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Cardabl", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#07110e]">
      <body className="antialiased">{children}</body>
    </html>
  );
}
