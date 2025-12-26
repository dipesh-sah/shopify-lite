import { query, execute } from './src/lib/db';

async function backfillOrderItemImages() {
  console.log('Backfilling order item images...\n');

  // Get all order items without images
  const itemsWithoutImages = await query(`
    SELECT oi.id, oi.order_id, oi.product_id, oi.image_url, p.title
    FROM order_items oi
    INNER JOIN products p ON oi.product_id = p.id
    WHERE oi.image_url IS NULL
  `) as any[];

  console.log(`Found ${itemsWithoutImages.length} order items without images\n`);

  let updated = 0;
  for (const item of itemsWithoutImages) {
    // Get the first product image
    const images = await query(`
      SELECT url 
      FROM product_images 
      WHERE product_id = ? 
      ORDER BY position ASC 
      LIMIT 1
    `, [item.product_id]) as any[];

    if (images.length > 0) {
      // Update the order item with the image
      await execute(`
        UPDATE order_items 
        SET image_url = ? 
        WHERE id = ?
      `, [images[0].url, item.id]);

      console.log(`✓ Updated item #${item.id} (${item.title}) with image: ${images[0].url}`);
      updated++;
    } else {
      console.log(`✗ No images found for product #${item.product_id} (${item.title})`);
    }
  }

  console.log(`\n✅ Backfill complete! Updated ${updated} out of ${itemsWithoutImages.length} order items.`);
  process.exit(0);
}

backfillOrderItemImages().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
