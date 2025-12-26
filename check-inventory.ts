import { query } from './src/lib/db';

async function checkVariantInventory() {
  console.log('Checking variant inventory...\n');

  const variants = await query(`
    SELECT 
      pv.id as variant_id,
      pv.title as variant_title,
      pv.inventory_quantity,
      pv.track_inventory,
      p.id as product_id,
      p.title as product_title,
      p.quantity as product_quantity,
      p.track_quantity as product_track_quantity
    FROM product_variants pv
    INNER JOIN products p ON pv.product_id = p.id
    WHERE p.title LIKE '%Clay Plant Pot%'
    ORDER BY p.title, pv.title
  `);

  console.log('Found', variants.length, 'variants for Clay Plant Pot products:\n');

  variants.forEach((v: any) => {
    console.log(`Product: ${v.product_title} (ID: ${v.product_id})`);
    console.log(`  - Variant: ${v.variant_title} (ID: ${v.variant_id})`);
    console.log(`  - Variant Inventory: ${v.inventory_quantity} (Track: ${v.track_inventory})`);
    console.log(`  - Product Quantity: ${v.product_quantity} (Track: ${v.product_track_quantity})`);
    console.log('');
  });

  process.exit(0);
}

checkVariantInventory().catch(console.error);
