'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

interface ProductOptionsProps {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
}

export function ProductOptions({ options, onChange }: ProductOptionsProps) {
  const addOption = () => {
    onChange([
      ...options,
      { id: Date.now().toString(), name: '', values: [] },
    ]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOptionName = (index: number, name: string) => {
    // Check for duplicates
    const isDuplicate = options.some((opt, i) => i !== index && opt.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      // You might want to show an error state here, but for now we basically allow typing 
      // but arguably we should block saving duplicates or visual cue.
      // For simplicity let's just allow it but we need to handle it in parent. 
      // actually, let's just warn or let the user know. 
      // The user's issue is they want 2 separate variants L and XL.
    }

    // Better approach: Allow typing, but maybe show warning in UI?
    const newOptions = [...options];
    newOptions[index].name = name;
    onChange(newOptions);
  };

  const addValue = (index: number, value: string) => {
    if (!value.trim()) return;
    const newOptions = [...options];
    if (!newOptions[index].values.includes(value.trim())) {
      newOptions[index].values.push(value.trim());
      onChange(newOptions);
    }
  };

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter(
      (_, i) => i !== valueIndex
    );
    onChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">Options</h3>
        {/* If no options, showing a button to add one */}
        {options.length === 0 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="w-4 h-4 mr-2" /> Add Option
          </Button>
        )}
      </div>

      {options.length > 0 && (
        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={option.id} className="p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Option Name</Label>
                    <Input
                      value={option.name}
                      onChange={(e) => updateOptionName(index, e.target.value)}
                      placeholder="e.g. Size, Color, Material"
                      className={`bg-white ${options.some((opt, i) => i !== index && opt.name.trim().toLowerCase() === option.name.trim().toLowerCase() && option.name)
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                        }`}
                    />
                    {options.some((opt, i) => i !== index && opt.name.trim().toLowerCase() === option.name.trim().toLowerCase() && option.name) && (
                      <p className="text-xs text-red-500 mt-1">Option name already exists. Please combine values into one option.</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs mb-1.5 block">Option Values</Label>
                    <div className="bg-white border rounded-md p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      {option.values.map((val, vIndex) => (
                        <Badge key={vIndex} variant="secondary" className="px-2 py-1 gap-1 text-sm font-normal">
                          {val}
                          <span onClick={() => removeValue(index, vIndex)} className="cursor-pointer text-muted-foreground hover:text-foreground ml-1">
                            <X className="w-3 h-3" />
                          </span>
                        </Badge>
                      ))}
                      <input
                        type="text"
                        placeholder={option.values.length === 0 ? "Add values..." : ""}
                        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addValue(index, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            addValue(index, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive mt-6"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="ghost" size="sm" onClick={addOption} className="text-primary hover:text-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Add another option
          </Button>
        </div>
      )}

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">This product has no options.</p>
      )}
    </div>
  );
}
