import { getCollectionBySlug } from '@/lib/collections';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/storefront/ProductCard';

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollectionBySlug(params.slug);

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Collection not found</div>
      </div>
    );
  }

  // Load products (MySQL)
  // Assuming getProducts supports filtering by category_id
  const products = await getProducts({ category: collection.id });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{collection.name}</h1>
        {collection.description && (
          <p className="text-gray-600 text-lg">{collection.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No products in this collection yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
