import { getSessionAction } from "@/actions/customer-auth"
import { getAddressesAction, deleteAddressAction, setDefaultAddressAction } from "@/actions/addresses"
import { AddressForm } from "@/components/storefront/AddressForm"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, Pencil, Trash2, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AddressesPage() {
  const user = await getSessionAction()
  if (!user) redirect("/signin")

  const addresses = await getAddressesAction()

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Account
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Addresses</h1>
              <p className="text-muted-foreground mt-1">Manage your shipping addresses</p>
            </div>
            <AddressForm />
          </div>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-gray-50/50">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No addresses yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Add a shipping address to speed up checkout.
            </p>
            <AddressForm />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address: any) => (
              <div key={address.id} className="relative group border rounded-lg p-6 bg-card transition-all hover:shadow-md">
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-semibold text-lg">{address.firstName} {address.lastName}</p>
                  {address.company && <p className="text-muted-foreground text-sm">{address.company}</p>}
                </div>

                <div className="text-sm text-muted-foreground space-y-1 mb-6">
                  <p>{address.address1}</p>
                  {address.address2 && <p>{address.address2}</p>}
                  <p>{address.city}, {address.province} {address.zip}</p>
                  <p>{address.country}</p>
                  {address.phone && <p className="mt-2">{address.phone}</p>}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <AddressForm
                    address={address}
                    trigger={
                      <Button variant="outline" size="sm" className="h-8">
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    }
                  />

                  <form action={deleteAddressAction.bind(null, address.id)}>
                    <Button variant="outline" size="sm" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </form>

                  {!address.isDefault && (
                    <form action={setDefaultAddressAction.bind(null, address.id)} className="ml-auto">
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                        Set as Default
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
