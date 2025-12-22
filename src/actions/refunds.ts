'use server'

import { execute, query } from "@/lib/db";
import { getSessionUserWithPermissions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function processRefundAction(orderId: string, amount: number, reason: string) {
  // 1. Check Permissions
  const user = await getSessionUserWithPermissions();
  if (!user || (!user.permissions.includes('*') && !user.permissions.includes('orders.write'))) {
    return { error: "Unauthorized" };
  }

  try {
    // 2. Get Order & Stripe Payment Intent ID
    // We typically store the PaymentIntent ID in the order or related transaction table.
    // If not stored (our current schema is basic), we might need to search Stripe or store it in `orders` table.
    // Wait, we didn't add `stripe_payment_intent_id` to `orders` table in Phase 1. 
    // We only linked `orderId` in Stripe metadata.

    // To refund, we need the PaymentIntent ID.
    // Ideally we should have stored it in Phase 1 Webhook.
    // Let's assume we can fetch it via search in Stripe using metadata, OR we failed to store it.
    // FIX: We should add `stripe_payment_intent_id` to `orders` schema if missing, or `transactions` table.
    // For now, let's search Stripe by metadata since we have orderId.

    const searchResult = await stripe.paymentIntents.search({
      query: `metadata['orderId']:'${orderId}'`,
    });

    if (searchResult.data.length === 0) {
      return { error: "Payment not found in Stripe" };
    }

    const paymentIntent = searchResult.data[0];

    // 3. Process Refund on Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      amount: Math.round(amount * 100), // cents
      reason: 'requested_by_customer', // or generic
      metadata: {
        reason: reason,
        adminId: user.id
      }
    });

    // 4. Record in DB
    const refundId = uuidv4();
    await execute(
      `INSERT INTO refunds (id, order_id, amount, reason, status, stripe_refund_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [refundId, orderId, amount, reason, refund.status === 'succeeded' ? 'completed' : 'pending', refund.id, user.id]
    );

    // 5. Update Order Status if full refund?
    if (amount >= (paymentIntent.amount / 100)) {
      await execute(`UPDATE orders SET payment_status = 'refunded' WHERE id = ?`, [orderId]);
    } else {
      // partial
      await execute(`UPDATE orders SET payment_status = 'partially_refunded' WHERE id = ?`, [orderId]);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Refund Error:", error);
    return { error: error.message || "Refund failed" };
  }
}
