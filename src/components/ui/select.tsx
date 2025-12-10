"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  currentLabel: string
  setCurrentLabel: (label: string) => void
} | null>(null)

export const Select = ({ children, value, onValueChange, defaultValue }: any) => {
  const [val, setVal] = React.useState(value || defaultValue || "")
  const [open, setOpen] = React.useState(false)
  const [currentLabel, setCurrentLabel] = React.useState("")

  const handleValueChange = (v: string) => {
    setVal(v)
    if (onValueChange) onValueChange(v)
    setOpen(false)
  }

  React.useEffect(() => {
    if (value !== undefined) setVal(value)
  }, [value])

  return (
    <SelectContext.Provider value={{ value: val, onValueChange: handleValueChange, open, setOpen, currentLabel, setCurrentLabel }}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </DropdownMenuPrimitive.Root>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </DropdownMenuPrimitive.Trigger>
))
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = React.forwardRef<HTMLSpanElement, any>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  return (
    <span className={cn("block truncate", className)}>
      {context?.currentLabel || context?.value || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

export const SelectContent = React.forwardRef<HTMLDivElement, any>(({ className, children, position = "popper", ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      sideOffset={5}
      {...props}
    >
      <div className={cn("p-1", className)}>
        {children}
      </div>
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
))
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<HTMLDivElement, any>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value

  React.useEffect(() => {
    if (isSelected && context && typeof children === 'string') {
      if (context.currentLabel !== children) context.setCurrentLabel(children)
    }
  }, [isSelected, children, context])

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onSelect={() => context?.onValueChange(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </DropdownMenuPrimitive.Item>
  )
})
SelectItem.displayName = "SelectItem"
