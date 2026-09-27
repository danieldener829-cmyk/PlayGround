import { NextRequest, NextResponse } from "next/server";
// Webhook Stripe (produção: validar assinatura com STRIPE_WEBHOOK_SECRET)
export async function POST(req: NextRequest) {
  const evt = await req.json().catch(() => ({}));
  console.log("stripe webhook:", evt?.type || "demo-event");
  return NextResponse.json({ received: true });
}
