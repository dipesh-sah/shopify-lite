'use client'

import { useState } from 'react'
import { showToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/ui/Spinner'
import { Download, Upload } from 'lucide-react'

export default function InventoryImportPage() {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [csvContent, setCsvContent] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      const lines = content.split('\n').map(line => line.trim()).filter(line => line)

      if (lines.length < 2) {
        showToast('CSV file must have at least a header and one data row', 'error')
        return
      }

      // Validate header
      const header = lines[0].toLowerCase()
      if (!header.includes('productid') || !header.includes('stock')) {
        showToast('CSV must have "productId" and "stock" columns', 'error')
        return
      }

      await performImport(lines)
    }
    reader.readAsText(file)
  }

  async function performImport(lines: string[]) {
    setImporting(true)
    try {
      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResults(data)
      showToast(`Import complete: ${data.success} updated, ${data.failed} failed`, 
        data.failed > 0 ? 'error' : 'success')
    } catch (error: any) {
      console.error('Import failed:', error)
      showToast(error.message || 'Import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const template = 'productId,variantId,stock\nproduct-1,variant-1,100\nproduct-1,variant-2,50\nproduct-2,,75'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-import-template.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Import</h1>
        <p className="text-muted-foreground mt-2">Bulk update product and variant stock levels via CSV</p>
      </div>

      {/* Template Download */}
      <div className="border rounded-lg p-6 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="font-semibold mb-2">CSV Format</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your CSV file should have columns: <code className="bg-muted px-2 py-1 rounded">productId</code>, 
              <code className="bg-muted px-2 py-1 rounded ml-1">variantId</code> (optional), 
              <code className="bg-muted px-2 py-1 rounded ml-1">stock</code>
            </p>
            <div className="bg-background p-3 rounded text-sm font-mono text-xs mb-4 overflow-x-auto">
              <div>productId,variantId,stock</div>
              <div>product-1,variant-1,100</div>
              <div>product-1,variant-2,50</div>
              <div>product-2,,75</div>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Upload CSV File</h2>
        <div className="flex gap-4 items-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={importing}
            className="flex-1 text-sm"
          />
          {importing && <Spinner className="h-5 w-5" />}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="font-semibold mb-4">Import Results</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{results.success}</div>
              <div className="text-sm text-green-600">Successfully Updated</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{results.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Errors:</h3>
              <div className="bg-muted p-3 rounded text-sm space-y-1 max-h-48 overflow-auto">
                {results.errors.map((error: string, i: number) => (
                  <div key={i} className="text-muted-foreground">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
