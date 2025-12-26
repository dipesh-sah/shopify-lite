import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serializeDate(date: any): string | null {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? String(date) : d.toISOString();
  } catch {
    return String(date);
  }
}
