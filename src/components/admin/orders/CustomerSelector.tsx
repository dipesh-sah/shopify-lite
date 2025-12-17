"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCustomersAction } from "@/actions/customers"
import { Input } from "@/components/ui/input"

interface CustomerSelectorProps {
  onSelect: (customer: any) => void
  selectedCustomer?: any
}

export function CustomerSelector({ onSelect, selectedCustomer }: CustomerSelectorProps) {
  const [query, setQuery] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setCustomers([]);
        return;
      }
      setLoading(true)
      try {
        const res = await getCustomersAction({ search: query, limit: 5 })
        setCustomers(res.customers || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
            <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onSelect(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customer by name or email..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-9"
        />
      </div>

      {showResults && (query.length > 0 || customers.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}
          {!loading && customers.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No customers found.</div>
          )}
          {!loading && customers.map((customer) => (
            <div
              key={customer.id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
              onClick={() => {
                onSelect(customer)
                setShowResults(false)
                setQuery("")
              }}
            >
              <div className="font-medium">{customer.firstName} {customer.lastName}</div>
              <div className="text-xs text-muted-foreground">{customer.email}</div>
            </div>
          ))}
          {!loading && query.length < 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Type at least 2 characters...</div>
          )}
        </div>
      )}
    </div>
  )
}
