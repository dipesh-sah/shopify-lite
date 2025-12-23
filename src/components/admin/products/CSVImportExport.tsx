"use client"

import { useState } from "react"
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { importProductsAction, exportProductsAction } from "@/actions/products"
import { toast } from "sonner"

export function CSVImportExport() {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; errors: string[] } | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const result = await importProductsAction(formData)
      if (result.success) {
        setImportResult({ success: true, count: result.count || 0, errors: result.errors || [] })
        toast.success(`Successfully imported ${result.count} products`)
      } else {
        toast.error(result.error || "Failed to import products")
      }
    } catch (error) {
      toast.error("An error occurred during import")
    } finally {
      setIsImporting(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportProductsAction()
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.filename || "products-export.csv"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success("Products exported successfully")
      } else {
        toast.error(result.error || "Failed to export products")
      }
    } catch (error) {
      toast.error("An error occurred during export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Products
            </CardTitle>
            <CardDescription>
              Download all your products in a Shopify-compatible CSV format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isExporting ? "Generating CSV..." : "Export to CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Products
            </CardTitle>
            <CardDescription>
              Upload a Shopify CSV file to bulk import or update products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isImporting}
                id="csv-upload"
              />
              <Button
                variant="outline"
                className="w-full h-12"
                disabled={isImporting}
              >
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isImporting ? "Importing..." : "Choose File"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Supports multiline descriptions, variants, and images.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Result UI */}
      {importResult && (
        <Card className={`border-l-4 ${importResult.errors.length > 0 ? "border-l-warning" : "border-l-success"}`}>
          <div className="p-4 flex flex-start gap-4">
            <div className="mt-1">
              {importResult.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-warning" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  {importResult.success ? "Import Completed" : "Import Failed"}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportResult(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Successfully processed <strong>{importResult.count}</strong> products.
              </p>

              {importResult.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-destructive">Issues found ({importResult.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto rounded bg-muted p-2">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px] font-mono py-0.5 border-b border-muted-foreground/10 last:border-0 italic">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
