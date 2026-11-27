import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ApiAuthBridge } from "@/components/auth/ApiAuthBridge";
import { AppClerkProvider } from "@/components/auth/AppClerkProvider";
import { isClerkEnabled } from "@/lib/auth-mode";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LUXOR9 — Global Brand Identity & Design System",
    template: "%s · LUXOR9",
  },
  description:
    "Intelligence Infrastructure. Controlled intelligence. Accountable execution. Complete global brand identity, visual architecture, and enterprise design system for LUXOR9.",
  openGraph: {
    title: "LUXOR9 — Global Brand Identity & Design System",
    description:
      "Intelligence Infrastructure. Turns business intent into controlled action, and every action into verifiable evidence.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <body>
      <ApiAuthBridge />
      {children}
    </body>
  );
  const tree = isClerkEnabled() ? (
    <AppClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {body}
    </AppClerkProvider>
  ) : (
    body
  );

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      {tree}
    </html>
  );
}
