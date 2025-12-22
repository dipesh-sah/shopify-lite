import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createOrderMySQL } from "@/lib/orders";
import { calculateShipping } from "@/lib/shipping";
import { query } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    title: z.string(),
    image: z.string().optional(),
  })),
  shippingAddress: z.any().optional(),
  billingAddress: z.any().optional(),
  customerEmail: z.string().email().optional(),
  userId: z.string().optional(),
  total: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      items,
      shippingAddress,
      billingAddress,
      customerEmail,
      userId,
      total
    } = checkoutSchema.parse(body);

    // --- Calculate Shipping ---
    let shippingCost = 0;

    if (shippingAddress && shippingAddress.country) {
      try {
        // 1. Calculate Total Weight
        let totalWeight = 0;

        // Fetch weights from DB
        const productIds = items.map(i => i.productId);
        if (productIds.length > 0) {
          const idList = productIds.map(() => '?').join(',');
          const products = await query<{ id: number; weight: number; weight_unit: string }>(
            `SELECT id, weight, weight_unit FROM products WHERE id IN (${idList})`,
            productIds
          );

          for (const item of items) {
            const product = products.find(p => p.id.toString() === item.productId.toString());
            if (product) {
              // Normalize to kg? Assuming kg for now
              const weight = Number(product.weight) || 0;
              totalWeight += weight * item.quantity;
            }
          }
        }

        // 2. Get Rates
        const rates = await calculateShipping(shippingAddress.country, totalWeight, total);
        if (rates.length > 0) {
          // Select cheapest by default
          rates.sort((a, b) => a.cost - b.cost);
          shippingCost = Number(rates[0].cost);
        }
      } catch (e) {
        console.error("Shipping Logic Error:", e);
        // Fallback to 0 or flat rate
      }
    }

    // 1. Create Pending Order in DB
    const orderId = await createOrderMySQL({
      userId: userId || "",
      customerEmail,
      items,
      total,
      shippingAddress,
      billingAddress,
      shippingCost: shippingCost,
    });

    // 2. Create Payment Intent
    // Stripe Amount = (Total + Shipping) * 100
    // Wait, 'total' passed from frontend might NOT include calculated shipping?
    // Usually it doesn't if logic is here.
    // So we add it.
    const finalAmount = Math.round((total + shippingCost) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId,
        userId: userId || "guest",
        customerEmail: customerEmail || "",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
      shippingCost: shippingCost
    });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
