import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updatePaymentStatusMySQL, updateOrderStatusMySQL } from "@/lib/orders";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any, // Cast to any to avoid type mismatch with old/new types
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          console.log(`Payment succeeded for Order ${orderId}`);
          await updatePaymentStatusMySQL(orderId, "paid");
          // Optionally update status to 'processing' if it was 'pending'
          await updateOrderStatusMySQL(orderId, "processing");
        }
        break;

      case "payment_intent.payment_failed":
        const intent = event.data.object as Stripe.PaymentIntent;
        const failedOrderId = intent.metadata.orderId;
        if (failedOrderId) {
          console.log(`Payment failed for Order ${failedOrderId}`);
          await updatePaymentStatusMySQL(failedOrderId, "failed");
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Error processing logic" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
