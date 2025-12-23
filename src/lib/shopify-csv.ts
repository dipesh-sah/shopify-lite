import Papa from 'papaparse';
import { Product, ProductVariant, ProductImage } from './products';

export interface ShopifyCsvRow {
  Handle: string;
  Title: string;
  'Body (HTML)': string;
  Vendor: string;
  Type: string;
  Tags: string;
  Published: string;
  'Option1 Name': string;
  'Option1 Value': string;
  'Option2 Name': string;
  'Option2 Value': string;
  'Option3 Name': string;
  'Option3 Value': string;
  'Variant SKU': string;
  'Variant Grams': string;
  'Variant Inventory Tracker': string;
  'Variant Inventory Qty': string;
  'Variant Inventory Policy': string;
  'Variant Fulfillment Service': string;
  'Variant Price': string;
  'Variant Compare At Price': string;
  'Variant Requires Shipping': string;
  'Variant Taxable': string;
  'Variant Barcode': string;
  'Image Src': string;
  'Image Position': string;
  'Image Alt Text': string;
  'Gift Card': string;
  'SEO Title': string;
  'SEO Description': string;
  'Google Shopping / Google Product Category': string;
  'Google Shopping / Gender': string;
  'Google Shopping / Age Group': string;
  'Google Shopping / MPN': string;
  'Google Shopping / AdWords Grouping': string;
  'Google Shopping / AdWords Labels': string;
  'Google Shopping / Condition': string;
  'Google Shopping / Custom Product': string;
  'Google Shopping / Custom Label 0': string;
  'Google Shopping / Custom Label 1': string;
  'Google Shopping / Custom Label 2': string;
  'Google Shopping / Custom Label 3': string;
  'Google Shopping / Custom Label 4': string;
  'Variant Image': string;
  'Variant Weight Unit': string;
  'Variant Tax Code': string;
}

export const SHOPIFY_CSV_HEADERS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type',
  'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Option3 Name', 'Option3 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
  'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
  'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category',
  'Google Shopping / Gender', 'Google Shopping / Age Group', 'Google Shopping / MPN',
  'Google Shopping / AdWords Grouping', 'Google Shopping / AdWords Labels',
  'Google Shopping / Condition', 'Google Shopping / Custom Product',
  'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1',
  'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
  'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit',
  'Variant Tax Code'
];

/**
 * Parses Shopify CSV text and groups rows by Handle into products with variants and images.
 */
export function parseShopifyCsv(csvText: string) {
  const result = Papa.parse<ShopifyCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    console.warn('CSV Parsing Errors:', result.errors);
  }

  const productsMap = new Map<string, any>();

  result.data.forEach((row) => {
    const handle = row.Handle;
    if (!handle) return;

    if (!productsMap.has(handle)) {
      // Initialize product if it's the first row with this handle
      productsMap.set(handle, {
        title: row.Title,
        slug: handle,
        description: row['Body (HTML)'] || '',
        vendor: row.Vendor || '',
        productType: row.Type || '',
        tags: row.Tags ? row.Tags.split(',').map((t) => t.trim()) : [],
        status: (row.Published?.toLowerCase() === 'true' || row.Published === '1') ? 'active' : 'draft',
        weightUnit: row['Variant Weight Unit'] || 'kg',
        images: [],
        variants: [],
        seo: {
          title: row['SEO Title'] || '',
          description: row['SEO Description'] || '',
        },
      });
    }

    const product = productsMap.get(handle);

    // Add Image if present
    if (row['Image Src']) {
      const existingImages = product.images.map((img: any) => img.url);
      if (!existingImages.includes(row['Image Src'])) {
        product.images.push({
          url: row['Image Src'],
          altText: row['Image Alt Text'] || '',
          position: parseInt(row['Image Position']) || product.images.length + 1,
        });
      }
    }

    // Add Variant if Option values or SKU are present
    const hasVariantData = row['Option1 Value'] || row['Variant SKU'] || row['Variant Price'];
    if (hasVariantData) {
      const options: Record<string, string> = {};
      if (row['Option1 Name'] && row['Option1 Value']) options[row['Option1 Name']] = row['Option1 Value'];
      if (row['Option2 Name'] && row['Option2 Value']) options[row['Option2 Name']] = row['Option2 Value'];
      if (row['Option3 Name'] && row['Option3 Value']) options[row['Option3 Name']] = row['Option3 Value'];

      product.variants.push({
        title: [row['Option1 Value'], row['Option2 Value'], row['Option3 Value']].filter(Boolean).join(' / ') || 'Default Title',
        sku: row['Variant SKU'] || '',
        price: parseFloat(row['Variant Price']) || 0,
        compareAtPrice: parseFloat(row['Variant Compare At Price']) || null,
        inventoryQuantity: parseInt(row['Variant Inventory Qty']) || 0,
        options,
        barcode: row['Variant Barcode'] || '',
        weight: parseFloat(row['Variant Grams']) || 0,
        weightUnit: row['Variant Weight Unit'] || 'g',
        requiresShipping: row['Variant Requires Shipping']?.toLowerCase() === 'true',
        taxable: row['Variant Taxable']?.toLowerCase() === 'true',
        images: row['Variant Image'] ? [row['Variant Image']] : [],
      });
    }
  });

  return Array.from(productsMap.values());
}

/**
 * Converts internal product structure to Shopify CSV rows.
 */
export function exportToShopifyCsv(products: Product[]) {
  const rows: Partial<ShopifyCsvRow>[] = [];

  products.forEach((product) => {
    const baseRow: Partial<ShopifyCsvRow> = {
      Handle: product.slug,
      Title: product.title,
      'Body (HTML)': product.description,
      Vendor: product.vendor || '',
      Type: product.productType || '',
      Tags: product.tags?.join(', ') || '',
      Published: product.status === 'active' ? 'true' : 'false',
      'SEO Title': product.seo?.title || '',
      'SEO Description': product.seo?.description || '',
    };

    const variants = product.variants || [];
    const images = product.images || [];
    const maxRows = Math.max(variants.length, images.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const row: Partial<ShopifyCsvRow> = i === 0 ? { ...baseRow } : { Handle: product.slug };

      const variant = variants[i];
      if (variant) {
        row['Variant SKU'] = variant.sku;
        row['Variant Price'] = variant.price.toString();
        row['Variant Inventory Qty'] = (variant.inventoryQuantity ?? 0).toString();

        // Options mapping (simplified)
        const optionKeys = Object.keys(variant.options || {});
        optionKeys.forEach((key, idx) => {
          if (idx === 0) {
            row['Option1 Name'] = key;
            row['Option1 Value'] = variant.options![key];
          } else if (idx === 1) {
            row['Option2 Name'] = key;
            row['Option2 Value'] = variant.options![key];
          } else if (idx === 2) {
            row['Option3 Name'] = key;
            row['Option3 Value'] = variant.options![key];
          }
        });

        if (variant.images && variant.images.length > 0) {
          row['Variant Image'] = variant.images[0];
        }
      }

      const image = images[i];
      if (image) {
        row['Image Src'] = image.url;
        row['Image Position'] = image.position.toString();
        row['Image Alt Text'] = image.altText || '';
      }

      rows.push(row);
    }
  });

  return Papa.unparse(rows, { columns: SHOPIFY_CSV_HEADERS });
}
