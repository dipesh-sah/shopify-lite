"use client"

import { useState, useEffect } from "react"
import { getRulesAction } from "@/actions/rules"
import { Rule } from "@/lib/rules/service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Loading from "@/components/ui/Loading"

interface RuleSelectorProps {
  value?: string
  onChange: (value: string) => void
  moduleType?: string
  placeholder?: string
  disabled?: boolean
}

export function RuleSelector({ value, onChange, moduleType, placeholder = "Select a rule...", disabled }: RuleSelectorProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchRules() {
      setLoading(true)
      try {
        const res = await getRulesAction(moduleType)
        setRules(res.rules)
      } catch (error) {
        console.error("Failed to load rules", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [moduleType])

  return (
    <Select value={value || "none"} onValueChange={(val: string) => onChange(val === "none" ? "" : val)} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? <div className="flex items-center gap-2"><Loading variant="inline" size="sm" /> Loading...</div> : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None (Always Active)</SelectItem>
        {rules.map((rule) => (
          <SelectItem key={rule.id} value={rule.id}>
            {rule.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
