'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useActionState } from "react"
import { createCompanyAction, updateCompanyAction } from "@/actions/companies"
import { useRouter } from "next/navigation"
import { Search, Plus } from "lucide-react"

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  companyExternalId: z.string().optional(),
  mainContactId: z.string().optional(),
  paymentTerms: z.string().optional(),
  allowOneTimeAddress: z.boolean().default(false),
  orderSubmissionType: z.enum(["auto", "draft"]).default("auto"),
  taxId: z.string().optional(),
  taxSettings: z.string().optional(),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().optional(),
  provinceCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  countryCode: z.string().optional(),
  zip: z.string().min(1, "ZIP code is required"),
  phone: z.string().optional(),
})

type CompanyFormValues = z.infer<typeof companySchema>

interface CompanyFormProps {
  initialData?: any
  isEditing?: boolean
}

export function CompanyForm({ initialData, isEditing }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultValues: CompanyFormValues = {
    name: initialData?.name || "",
    companyExternalId: initialData?.companyExternalId || "",
    mainContactId: initialData?.mainContactId || "",
    paymentTerms: initialData?.paymentTerms || "",
    allowOneTimeAddress: initialData?.allowOneTimeAddress || false,
    orderSubmissionType: initialData?.orderSubmissionType || "auto",
    taxId: initialData?.taxId || "",
    taxSettings: initialData?.taxSettings || "collect",
    // Location defaults
    address1: initialData?.locations?.[0]?.address1 || "",
    address2: initialData?.locations?.[0]?.address2 || "",
    city: initialData?.locations?.[0]?.city || "",
    province: initialData?.locations?.[0]?.province || "",
    provinceCode: initialData?.locations?.[0]?.provinceCode || "",
    country: initialData?.locations?.[0]?.country || "United States",
    countryCode: initialData?.locations?.[0]?.countryCode || "",
    zip: initialData?.locations?.[0]?.zip || "",
    phone: initialData?.locations?.[0]?.phone || "",
  }

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as any,
    defaultValues,
  })

  async function onSubmit(data: CompanyFormValues) {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      if (isEditing && initialData?.id) {
        await updateCompanyAction(initialData.id, null, formData)
      } else {
        await createCompanyAction(null, formData)
      }
      router.push("/admin/companies")
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-10">

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{isEditing ? "Edit company" : "New company"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Discard</Button>
            <Button type="submit" disabled={loading}>Save</Button>
          </div>
        </div>

        {/* Company Info */}
        <section className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company name</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>This will appear in customer accounts and at checkout.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyExternalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company ID</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>Add an existing external ID or create a unique ID.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Main Contact */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Main contact</h3>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search" />
            {/* Search Implementation Mock - would require a combobox */}
          </div>
        </section>

        {/* Location */}
        <section className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Location</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Add a location to this company. This is where you'll ship products to. Each location can have custom catalogs, checkout settings, and more.
          </p>

          <div className="border rounded-md p-4 space-y-4">
            <h4 className="font-medium">Shipping address</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="Address" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="Country" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="ZIP / Postal Code" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        {/* Markets - Mocked */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Markets</h3>
          <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            All B2B
          </div>
        </section>

        {/* Catalogs - Mocked */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Catalogs</h3>
          <div className="flex gap-2">
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary">Injectable Peptides</div>
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary">Capsules</div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full"><Plus className="h-4 w-4" /></Button>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment terms</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">No payment terms</option>
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Checkout */}
        <section className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
          <h3 className="text-lg font-medium">Checkout</h3>

          <FormField
            control={form.control}
            name="allowOneTimeAddress"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Ship to address
                  </FormLabel>
                  <FormDescription>
                    Allow customers to ship to any one-time address
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderSubmissionType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Order submission</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="auto"
                        value="auto"
                        checked={field.value === "auto"}
                        onChange={() => field.onChange("auto")}
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <label htmlFor="auto" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Automatically submit orders</label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">Orders without shipping addresses will be submitted as draft orders</p>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="draft"
                        value="draft"
                        checked={field.value === "draft"}
                        onChange={() => field.onChange("draft")}
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <label htmlFor="draft" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Submit all orders as drafts for review</label>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Tax Details */}
        <section className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
          <h3 className="text-lg font-medium">Tax details</h3>
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxSettings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax settings</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="collect">Collect tax</option>
                    <option value="exempt">Tax exempt</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

      </form>
    </Form>
  )
}
