'use client';

import { useState } from 'react';
import { setB2BProductPricingAction } from '@/actions/admin-b2b';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface B2BPricingFormProps {
  productId: number;
  productTitle: string;
  regularPrice: number;
}

export default function B2BPricingForm({ productId, productTitle, regularPrice }: B2BPricingFormProps) {
  const [pricingType, setPricingType] = useState<'fixed' | 'percentage'>('fixed');
  const [price, setPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [minQuantity, setMinQuantity] = useState('1');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const calculatedPrice = pricingType === 'percentage' && discountPercentage
    ? (regularPrice * (1 - parseFloat(discountPercentage) / 100)).toFixed(2)
    : price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const result = await setB2BProductPricingAction({
        productId,
        pricingType,
        price: pricingType === 'fixed' ? parseFloat(price) : undefined,
        discountPercentage: pricingType === 'percentage' ? parseFloat(discountPercentage) : undefined,
        minQuantity: parseInt(minQuantity),
        maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred while setting B2B pricing');
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set B2B Pricing</CardTitle>
        <CardDescription>
          Configure wholesale pricing for {productTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              B2B pricing updated successfully!
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Regular Price</p>
              <p className="text-lg font-semibold">${regularPrice.toFixed(2)}</p>
            </div>
            {calculatedPrice && (
              <div>
                <p className="text-sm text-muted-foreground">B2B Price</p>
                <p className="text-lg font-semibold text-green-600">${calculatedPrice}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricingType">Pricing Type</Label>
            <Select value={pricingType} onValueChange={(val: any) => setPricingType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="percentage">Percentage Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pricingType === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="price">B2B Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          )}

          {pricingType === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage *</Label>
              <div className="flex gap-2">
                <Input
                  id="discountPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  required
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity *</Label>
              <Input
                id="minQuantity"
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxQuantity">Maximum Quantity</Label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                placeholder="No limit"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save B2B Pricing'}
            </Button>
            <Button type="button" variant="outline" disabled={loading}>
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
