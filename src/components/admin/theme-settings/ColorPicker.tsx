"use client";

import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  className?: string;
}

export function ColorPicker({
  label,
  value,
  onChange,
  description,
  className,
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-md border shadow-sm cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/20"
          style={{ backgroundColor: value }}
          onClick={() => inputRef.current?.click()}
        />
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 font-mono uppercase"
            placeholder="#000000"
            maxLength={7}
          />
          <Pipette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
