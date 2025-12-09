'use client';

import { useState, useEffect } from 'react';
import { getProductsAction } from '@/actions/products';
import { useCart } from '@/store/cart';
import { getBulkPricingTiers } from '@/lib/pricing';
import { showToast } from '@/components/ui/Toast';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';

export default function BulkOrderPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getProductsAction();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateQuantity(productId: string, delta: number) {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [productId]: updated };
    });
  }

  function handleAddToCart(product: any) {
    const qty = quantities[product.id] || 0;
    if (qty === 0) return;

    addItem({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      images: product.images || [],
      categoryId: product.categoryId || ''
    }, qty, product.variants?.[0]?.id);

    showToast(`Added ${qty} ${product.name} to cart`, 'success');
    setQuantities((prev) => ({ ...prev, [product.id]: 0 }));
  }

  function addAllToCart() {
    let addedCount = 0;
    Object.entries(quantities).forEach(([productId, qty]) => {
      if (qty > 0) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          addItem({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            images: product.images || [],
            categoryId: product.categoryId || ''
          }, qty, product.variants?.[0]?.id);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      showToast(`Added ${addedCount} products to cart`, 'success');
      setQuantities({});
    }
  }

  if (loading) {
    return <div className="container py-12 text-center">Loading catalog...</div>;
  }

  return (
    <div className="container py-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk Order Form</h1>
          <p className="text-muted-foreground">
            Quickly add multiple items to your cart for wholesale ordering.
          </p>
        </div>
        <button
          onClick={addAllToCart}
          disabled={Object.values(quantities).every((q) => q === 0)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <ShoppingCart className="w-5 h-5" />
          Add All to Cart
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">SKU</th>
              <th className="px-6 py-4 font-semibold">Price Tiers</th>
              <th className="px-6 py-4 font-semibold text-center">Quantity</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => {
              const tiers = getBulkPricingTiers(product.price);
              const currentQty = quantities[product.id] || 0;

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    {product.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      {tiers.map((tier, i) => (
                        <div key={i} className="flex justify-between w-32">
                          <span className="text-gray-500">{tier.label}:</span>
                          <span className="font-medium">${tier.price}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={currentQty}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [product.id]: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-16 text-center border rounded py-1"
                        min="0"
                      />
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={currentQty === 0}
                      className="text-primary font-medium hover:underline disabled:text-gray-400"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
