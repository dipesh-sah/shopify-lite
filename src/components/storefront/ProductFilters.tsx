'use client';

import { useState } from 'react';

interface ProductFiltersProps {
  categories: any[];
  priceRange: { min: number; max: number };
  onFilterChange: (filters: any) => void;
}

export default function ProductFilters({ categories, priceRange, onFilterChange }: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(priceRange.min);
  const [maxPrice, setMaxPrice] = useState(priceRange.max);
  const [sortBy, setSortBy] = useState('featured');

  function handleCategoryToggle(categoryId: string) {
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(updated);
    applyFilters(updated, minPrice, maxPrice, sortBy);
  }

  function handlePriceChange() {
    applyFilters(selectedCategories, minPrice, maxPrice, sortBy);
  }

  function handleSortChange(newSort: string) {
    setSortBy(newSort);
    applyFilters(selectedCategories, minPrice, maxPrice, newSort);
  }

  function applyFilters(cats: string[], min: number, max: number, sort: string) {
    onFilterChange({
      categories: cats,
      minPrice: min,
      maxPrice: max,
      sortBy: sort,
    });
  }

  function clearFilters() {
    setSelectedCategories([]);
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    setSortBy('featured');
    onFilterChange({
      categories: [],
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sortBy: 'featured',
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                className="mr-2"
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Price Range</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Min Price</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(parseFloat(e.target.value))}
              onBlur={handlePriceChange}
              className="w-full border rounded px-3 py-2"
              min={priceRange.min}
              max={maxPrice}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Max Price</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              onBlur={handlePriceChange}
              className="w-full border rounded px-3 py-2"
              min={minPrice}
              max={priceRange.max}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handlePriceChange}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  );
}
