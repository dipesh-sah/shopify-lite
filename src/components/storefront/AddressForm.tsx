'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { addAddressAction, updateAddressAction } from "@/actions/addresses"
import { Country, State, City } from 'country-state-city'

interface AddressFormProps {
  address?: any
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddressForm({ address, trigger, onSuccess }: AddressFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Location State
  const [selectedCountry, setSelectedCountry] = useState<string>(address?.country || 'US')
  const [selectedState, setSelectedState] = useState<string>(address?.province || '')
  const [selectedCity, setSelectedCity] = useState<string>(address?.city || '')

  // Available lists
  const countries = Country.getAllCountries()
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : []
  const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : []

  // Update states when country changes
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value
    setSelectedCountry(countryCode)
    setSelectedState('')
    setSelectedCity('')
  }

  // Update cities when state changes
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value
    setSelectedState(stateCode)
    setSelectedCity('')
  }

  // Initialize from props if editing
  useEffect(() => {
    if (address) {
      // We need to map the stored names back to codes if possible, 
      // but country-state-city uses ISO codes mostly.
      // Assuming database stores ISO codes would be best, but if it stores names, we might have mapping issues.
      // For now, let's assume we store what the library returns.
      // Actually, standardizing on ISO codes for storage is better, but UI might want full names.
      // Let's store Names in DB (as per previous schema typically) but use Codes for selection logic if I can map back.
      // Simplification: Store IDs/Names directly in form. 
      // Current DB schema is text. Let's try to find code by name if needed, or just default to US.

      // If address.country is a full name like "United States", we need to find "US".
      const c = countries.find(c => c.name === address.country || c.isoCode === address.country)
      if (c) setSelectedCountry(c.isoCode)

      // Similar for state, need to find state code by name within that country
      // This logic is complex if DB stores names.
      // Let's just set the values directly if they match a code.
    }
  }, [address])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // Override with full names for better display, or keep codes?
    // User asked for "Country select -> State -> City". Usually better to store names for Label printing.
    const countryObj = countries.find(c => c.isoCode === selectedCountry)
    const stateObj = states.find(s => s.isoCode === selectedState)
    // City is just text name in library usually, or object.
    const cityObj = cities.find(c => c.name === selectedCity)

    if (countryObj) formData.set('country', countryObj.name)
    if (stateObj) formData.set('province', stateObj.name)
    // City might be free text if not found in list (fallback) or selected from list
    // formData.set('city', selectedCity) // already handled by input/select name="city"

    try {
      if (address) {
        await updateAddressAction(address.id, formData)
      } else {
        await addAddressAction(formData)
      }
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error(error)
      alert("Failed to save address")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Address</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={address?.firstName} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={address?.lastName} required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" defaultValue={address?.company} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address1">Address</Label>
            <Input id="address1" name="address1" defaultValue={address?.address1} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address2">Apartment, suite, etc.</Label>
            <Input id="address2" name="address2" defaultValue={address?.address2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                name="country_code" // Validating we use code for state lookup
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCountry}
                onChange={handleCountryChange}
                required
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="province">State / Province</Label>
              {states.length > 0 ? (
                <select
                  id="province"
                  name="province_code"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedState}
                  onChange={handleStateChange}
                  required
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <Input id="province" name="province" placeholder="State / Province" defaultValue={address?.province} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              {cities.length > 0 ? (
                <select
                  id="city"
                  name="city"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <Input id="city" name="city" placeholder="City" defaultValue={address?.city || selectedCity} onChange={(e) => setSelectedCity(e.target.value)} required />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Postal / Zip Code</Label>
              <Input id="zip" name="zip" defaultValue={address?.zip} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={address?.phone} />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="isDefault" name="isDefault" value="true" defaultChecked={address?.isDefault} />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
