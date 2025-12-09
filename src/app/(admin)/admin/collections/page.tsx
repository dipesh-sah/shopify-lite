'use client';

import { useState, useEffect } from 'react';
import { getCollectionsAction, createCollectionAction, updateCollectionAction, deleteCollectionAction } from '@/actions/collections';
import { getProductsAction } from '@/actions/products';


export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    type: 'manual' as 'manual' | 'smart',
    productIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [collectionsData, productsData] = await Promise.all([
        getCollectionsAction(),
        getProductsAction(),
      ]);
      setCollections(collectionsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingCollection) {
        await updateCollectionAction(editingCollection.id, formData);
      } else {
        await createCollectionAction(formData);
      }

      setFormData({
        name: '',
        description: '',
        slug: '',
        type: 'manual',
        productIds: [],
        isActive: true,
      });
      setShowForm(false);
      setEditingCollection(null);
      loadData();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Error saving collection');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      await deleteCollectionAction(id);
      loadData();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Error deleting collection');
    }
  }

  function handleEdit(collection: any) {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      slug: collection.slug,
      type: collection.type,
      productIds: collection.productIds || [],
      isActive: collection.isActive,
    });
    setShowForm(true);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Collections</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCollection(null);
            setFormData({
              name: '',
              description: '',
              slug: '',
              type: 'manual',
              productIds: [],
              isActive: true,
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCollection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'manual' | 'smart' })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="manual">Manual</option>
                <option value="smart">Smart (Auto)</option>
              </select>
            </div>

            {formData.type === 'manual' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Products</label>
                <select
                  multiple
                  value={formData.productIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, productIds: selected });
                  }}
                  className="w-full border rounded px-3 py-2 h-40"
                >
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingCollection ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCollection(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div key={collection.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{collection.name}</h3>
              <span className={`px-2 py-1 text-xs rounded ${collection.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {collection.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4">{collection.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Type: {collection.type}</span>
              <span>{collection.productIds?.length || 0} products</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(collection)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(collection.id)}
                className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No collections yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
