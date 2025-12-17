"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Company {
  id: string
  name: string
  orderingStatus: 'approved' | 'not_approved'
  locationCount: number
  totalOrders: number
  totalSpent: number
  mainContact?: {
    firstName: string
    lastName: string
  }
}

interface CompaniesTableProps {
  companies: Company[]
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")

  const filteredCompanies = companies.filter(company => {
    // Filter by tab
    if (currentTab === "approved" && company.orderingStatus !== "approved") return false
    if (currentTab === "not_approved" && company.orderingStatus !== "not_approved") return false

    // Filter by search
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      company.name.toLowerCase().includes(query) ||
      company.mainContact?.firstName.toLowerCase().includes(query) ||
      company.mainContact?.lastName.toLowerCase().includes(query)
    )
  })

  const toggleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([])
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedCompanies.includes(id)) {
      setSelectedCompanies(selectedCompanies.filter(c => c !== id))
    } else {
      setSelectedCompanies([...selectedCompanies, id])
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
            <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">All</TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Ordering approved</TabsTrigger>
            <TabsTrigger value="not_approved" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Ordering not approved</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies"
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[40px] pl-4">
                  <Checkbox
                    checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground w-[200px]">Company</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground">Ordering</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground">Locations</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground">Main contact</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground">Total orders</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground text-right">Total sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id} className="hover:bg-muted/50">
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => toggleSelect(company.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/companies/${company.id}`} className="hover:underline text-sm font-medium">
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={company.orderingStatus === 'approved' ? 'default' : 'secondary'}
                      className={`
                        font-normal border-0 px-2.5 py-0.5 rounded-full
                        ${company.orderingStatus === 'approved'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                    >
                      <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${company.orderingStatus === 'approved' ? 'bg-green-600' : 'bg-gray-500'}`} />
                      {company.orderingStatus === 'approved' ? 'Approved' : 'Not approved'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.locationCount} {company.locationCount === 1 ? 'location' : 'locations'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.mainContact ? `${company.mainContact.firstName} ${company.mainContact.lastName}` : 'No main contact'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.totalOrders} {company.totalOrders === 1 ? 'order' : 'orders'}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-right">
                    ${company.totalSpent.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* Pagination placeholder */}
        <div className="text-xs text-muted-foreground">
          1-{filteredCompanies.length}
        </div>
      </div>
    </div>
  )
}
