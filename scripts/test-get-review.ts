
import { getReview } from '../src/lib/reviews';
import { pool } from '../src/lib/db';

async function test() {
  try {
    const review = await getReview(1);
    console.log('getReview(1) result:', review);
  } catch (error) {
    console.error('getReview failed:', error);
  } finally {
    await pool.end();
  }
}

test();
