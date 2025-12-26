"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ChevronLeft } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { createCustomerAction, updateCustomerAction } from "@/actions/customers"
import Link from "next/link"

import { TagInput } from "@/components/admin/TagInput"
import { Package } from "lucide-react"
import { MetafieldsRenderer } from "@/components/admin/metadata/MetafieldsRenderer"
import Loading from "@/components/ui/Loading"

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  acceptsMarketing: z.boolean(),
  address: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    provinceCode: z.string().optional(),
    zip: z.string().min(1, "ZIP code is required"),
    phone: z.string().optional(),
  }).optional(),
  metafields: z.array(z.any()).optional().default([])
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: any
  isEditing?: boolean
  orders?: any[]
}

export function CustomerForm({ initialData, isEditing = false, orders = [] }: CustomerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      tags: [],
      acceptsMarketing: false,
      address: {
        firstName: "",
        lastName: "",
        address1: "",
        city: "",
        country: "United States",
        provinceCode: "",
        zip: "",
        phone: "",
      },
      metafields: []
    },
  })

  async function onSubmit(data: CustomerFormValues) {
    setLoading(true)
    try {
      let result;
      if (isEditing && initialData?.id) {
        result = await updateCustomerAction(initialData.id, data)
      } else {
        result = await createCustomerAction(data)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Customer ${isEditing ? "updated" : "created"} successfully.`,
        })
        router.push("/admin/customers")
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Something went wrong.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon" className="h-7 w-7" type="button">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {isEditing ? `Edit Customer` : "New Customer"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
              Discard
            </Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading && <Loading variant="inline" size="sm" />}
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_250px] lg:grid-cols-3">
          <div className="grid auto-rows-max gap-6 lg:col-span-2">
            {/* Customer Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
                <CardDescription>
                  Basic information about the customer.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 555-555-5555" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acceptsMarketing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 sm:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Customer agreed to receive marketing emails.
                        </FormLabel>
                        <FormDescription>
                          You should ask for permission before sending marketing emails.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Address</CardTitle>
                <CardDescription>
                  The customer's primary address.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country/Region</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          {/* Use customer name as default if address name is empty, handled by react-hook-form defaultValues ideally */}
                          <Input placeholder="First Name" {...field} value={field.value || form.getValues('firstName')} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} value={field.value || form.getValues('lastName')} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address.address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.provinceCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 555-555-5555" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Orders History */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No orders found for this customer.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <Package className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline">
                                Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${Number(order.total).toFixed(2)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Add a note about this customer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TagInput
                            tags={field.value || []}
                            onChange={field.onChange}
                            placeholder="Add tags..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-4">
            {/* Metafields */}
            <MetafieldsRenderer
              ownerType="customer"
              ownerId={initialData?.id}
              onChange={(metafields) => form.setValue('metafields', metafields)}
            />
          </div>
        </div>

      </form>
    </Form >
  )
}
