
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config();

async function testCreateReview() {
  try {
    const { query, execute } = await import('../lib/db');
    const { createReview } = await import('../lib/reviews');

    console.log('Fetching a product...');
    const products = await query('SELECT id, title FROM products LIMIT 1');
    if (products.length === 0) {
      console.log('No products found to test review.');
      return;
    }

    const product = products[0];
    console.log('Found product:', product);

    console.log('Creating review for product', product.id);
    const reviewId = await createReview({
      productId: product.id.toString(),
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      rating: 5,
      title: 'Test Review',
      content: 'This is a test review from script.',
    });

    console.log('Review created successfully! ID:', reviewId);

    // Verify it exists
    const review = await query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    console.log('Fetched created review:', review[0]);

    process.exit(0);
  } catch (error) {
    console.error('Error creating review:', error);
    process.exit(1);
  }
}

testCreateReview();
