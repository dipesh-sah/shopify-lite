"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Check, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const locales = [
  { id: "uk-usd", label: "United Kingdom | USD $", country: "GB", currency: "USD" },
  { id: "us-usd", label: "United States | USD $", country: "US", currency: "USD" },
  { id: "de-eur", label: "Germany | EUR €", country: "DE", currency: "EUR" },
  { id: "fr-eur", label: "France | EUR €", country: "FR", currency: "EUR" },
]

export function LocaleSelector() {
  const [selected, setSelected] = useState(locales[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("store-locale")
    if (saved) {
      const locale = locales.find((l) => l.id === saved)
      if (locale) setSelected(locale)
    }
  }, [])

  const handleSelect = (locale: typeof locales[0]) => {
    setSelected(locale)
    localStorage.setItem("store-locale", locale.id)
  }

  if (!mounted) {
    return (
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 opacity-50 cursor-not-allowed">
        <span className="text-[12px] font-medium text-white/70">United Kingdom | USD $</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/40" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button suppressHydrationWarning className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors group">
          <span className="text-[12px] font-medium text-white/70 group-hover:text-white transition-colors">
            {selected.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] bg-[#1f2937] border-white/10 text-white p-1">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.id}
            onClick={() => handleSelect(locale)}
            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors"
          >
            <span className="text-sm font-medium">{locale.label}</span>
            {selected.id === locale.id && <Check className="h-4 w-4 text-white" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
