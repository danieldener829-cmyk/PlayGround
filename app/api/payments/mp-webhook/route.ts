import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.log("mercadopago webhook:", body?.type || "payment-demo");
  return NextResponse.json({ received: true });
}
