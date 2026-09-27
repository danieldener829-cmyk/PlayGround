import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HOSTBOTS — Hospede seu Bot do Discord em 5 segundos",
  description: "Discloud + Vercel + Hostinger em uma só. Bots e sites em 1 clique.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-void">
        <Navbar />
        {children}
        <footer className="border-t border-white/10 mt-20 py-10 text-center text-sm text-white/50">
          HOSTBOTS © 2026 — Feito no Brasil · hostbots.com.br · <a className="underline" href="/docs">Docs</a> · <a className="underline" href="/pricing">Planos</a>
        </footer>
      </body>
    </html>
  );
}
