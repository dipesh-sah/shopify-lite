
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createReview, getReviews, updateReview, deleteReview, getReviewStats, getReview } from '../src/lib/reviews';
import { execute, pool } from '../src/lib/db';

async function verify() {
  console.log('--- Starting Review System Verification ---');

  try {
    // 1. Create a dummy product for testing (if not exists)
    // We need a valid product_id. Let's assume ID 1 exists or insert one.
    // Ideally we insert one to be safe.
    await execute(`
        INSERT INTO products (id, title, slug, status, price, track_quantity, quantity, weight_unit, created_at, updated_at) 
        VALUES (999999, 'Test Product', 'test-product', 'active', 10, 0, 100, 'kg', NOW(), NOW())
        ON DUPLICATE KEY UPDATE title='Test Product'
    `);
    const productId = 999999;
    console.log(`[PASS] Test Product Checked (ID: ${productId})`);

    // 2. Create Review
    const reviewId = await createReview({
      product_id: productId,
      title: 'Great Product',
      rating: 5,
      content: 'I loved it!',
      author_name: 'Tester',
      email: 'test@example.com',
      status: 'active',
      is_verified: true
    });
    console.log(`[PASS] Created Review (ID: ${reviewId})`);

    // 3. Get Review
    const review = await getReview(reviewId);
    if (review && review.title === 'Great Product') {
      console.log(`[PASS] Fetched Single Review`);
    } else {
      console.error(`[FAIL] Review mismatch`, review);
    }

    // 4. Update Review
    await updateReview(reviewId, { rating: 4, content: 'Actually it is okay' });
    const updated = await getReview(reviewId);
    if (updated && updated.rating === 4) {
      console.log(`[PASS] Updated Review`);
    } else {
      console.error(`[FAIL] Update failed`, updated);
    }

    // 5. List Reviews (Admin)
    const list = await getReviews({ productId, status: 'active' });
    if (list.total >= 1) {
      console.log(`[PASS] Listed Reviews (Total: ${list.total})`);
    } else {
      console.error(`[FAIL] List returned empty`);
    }

    // 6. Stats
    const stats = await getReviewStats(productId);
    if (Number(stats.average_rating) > 0 || stats.totalReviews > 0) {
      console.log(`[PASS] Stats Calculated (Avg: ${stats.averageRating}, Total: ${stats.totalReviews})`);
    } else {
      console.error(`[FAIL] Stats empty`, stats);
    }

    // 7. Delete Review
    await deleteReview(reviewId);
    const deleted = await getReview(reviewId);
    if (!deleted) {
      console.log(`[PASS] Deleted Review`);
    } else {
      console.error(`[FAIL] Review still exists`);
    }

    // Cleanup Product
    await execute('DELETE FROM products WHERE id = ?', [productId]);
    console.log(`[PASS] Cleanup Complete`);

  } catch (error) {
    console.error('Verification Failed:', error);
  } finally {
    await pool.end();
  }
}

verify();
