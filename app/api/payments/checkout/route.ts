import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Checkout demo: valida cupom, calcula valor, retorna sessão Stripe / QR PIX.
// Produção: trocar por stripe.paymentIntents.create e MercadoPago SDK.
export async function POST(req: NextRequest) {
  const { plan, method, coupon } = await req.json();
  const base = plan === "PRO" ? 29.9 : 9.9;
  const c = db.coupons().find((x) => x.code === (coupon || "").toUpperCase());
  const amount = c ? +(base * (1 - c.pct / 100)).toFixed(2) : base;
  if (method === "pix") return NextResponse.json({ qr: "00020126580014BR.GOV.BCB.PIXdemo", amount: `R$${amount}`, provider: "mercadopago" });
  return NextResponse.json({ sessionId: "cs_demo_" + Math.random().toString(36).slice(2), amount: `R$${amount}`, provider: "stripe" });
}
