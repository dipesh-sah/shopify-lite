'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react" // Removed Loader2
import Loading from "@/components/ui/Loading" // Added Loading import
import { exportProductsAction, importProductsAction } from "@/actions/products"
import { useToast } from "@/components/ui/use-toast"

export function ProductActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportProductsAction();
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      if (result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: "Success", description: "Products exported successfully" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to export products", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const result = await importProductsAction(formData);

      if (result.success) {
        toast({ title: "Success", description: `Imported ${result.count} products successfully` });
        if (result.errors && result.errors.length > 0) {
          console.warn("Import errors:", result.errors);
          toast({ title: "Warning", description: "Some rows failed to import. Check console.", variant: "destructive" });
        }
      } else {
        toast({ title: "Error", description: result.error || "Import failed", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to import products", variant: "destructive" });
    } finally {
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1" disabled={isExporting || isImporting}>
            {(isExporting || isImporting) ? (
              <Loading variant="inline" size="sm" />
            ) : (
              <>More actions <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleImportClick}>Import</DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>Export</DropdownMenuItem>
          <DropdownMenuItem>Sync inventory</DropdownMenuItem>
          <DropdownMenuItem>Archive selected</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
