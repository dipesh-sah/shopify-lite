'use client'

import { useState, useEffect } from 'react'
import { getSettingsAction, updateSettingsAction, getNumberRangesAction, updateNumberRangeAction } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import Loading from "@/components/ui/Loading"
import dynamic from 'next/dynamic'
import { UsersManager } from '@/components/admin/UsersManager'
import { TaxManager } from '@/components/admin/TaxManager'
import { RuleManager } from '@/components/admin/rules/RuleManager'
import { RuleSelector } from '@/components/admin/rules/RuleSelector'
import { MetafieldDefinitionsManager } from '@/components/admin/metadata/MetafieldDefinitionsManager'
import { MetaobjectDefinitionsManager } from '@/components/admin/metadata/MetaobjectDefinitionsManager'
import { showToast } from '@/components/ui/Toast'

const TwoFactorSettings = dynamic(() => import('@/components/admin/TwoFactorSettings').then(mod => mod.TwoFactorSettings), {
  ssr: false,
  loading: () => <Loading size="md" />
})

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const commonCurrencies = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'JPY - Japanese Yen', value: 'JPY' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'INR - Indian Rupee', value: 'INR' },
  { label: 'CNY - Chinese Yuan', value: 'CNY' },
]

const commonTimezones = [
  { label: 'UTC', value: 'UTC' },
  { label: 'GMT', value: 'GMT' },
  { label: 'EST (UTC-5)', value: 'America/New_York' },
  { label: 'CST (UTC-6)', value: 'America/Chicago' },
  { label: 'MST (UTC-7)', value: 'America/Denver' },
  { label: 'PST (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'BST (UTC+1)', value: 'Europe/London' },
  { label: 'CEST (UTC+2)', value: 'Europe/Paris' },
  { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'JST (UTC+9)', value: 'Asia/Tokyo' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})

  // Fetch settings when tab changes
  useEffect(() => {
    loadSettings(activeTab)
  }, [activeTab])

  async function loadSettings(category: string) {
    if (category === 'users') {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (category === 'number-ranges') {
        const ranges = await getNumberRangesAction()
        setSettings({ ranges })
      } else {
        const data = await getSettingsAction(category)
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (activeTab === 'number-ranges') {
        // Save each range individually
        if (settings.ranges) {
          await Promise.all(settings.ranges.map((range: any) =>
            updateNumberRangeAction(range.id, {
              prefix: range.prefix,
              suffix: range.suffix,
              start_value: range.start_value,
              current_value: range.current_value
            })
          ))
        }
      } else {
        await updateSettingsAction(activeTab, settings)
      }
      showToast('Settings saved successfully', 'success')
    } catch (error) {
      console.error('Failed to save settings', error)
      showToast('Failed to save settings. You might not have permission.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(key: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your store configuration and preferences.
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border rounded-lg bg-background shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r bg-muted/10">
            <TabsList className="flex flex-col h-full items-start justify-start w-full bg-transparent p-2 space-y-1">
              <TabsTrigger value="general" className="w-full justify-start px-3 py-2 text-sm font-medium">General</TabsTrigger>
              <TabsTrigger value="tax" className="w-full justify-start px-3 py-2 text-sm font-medium">Taxes</TabsTrigger>
              <TabsTrigger value="payment" className="w-full justify-start px-3 py-2 text-sm font-medium">Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="w-full justify-start px-3 py-2 text-sm font-medium">Shipping</TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2 text-sm font-medium">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="w-full justify-start px-3 py-2 text-sm font-medium">Security</TabsTrigger>
              <TabsTrigger value="users" className="w-full justify-start px-3 py-2 text-sm font-medium">Users</TabsTrigger>
              <TabsTrigger value="rules" className="w-full justify-start px-3 py-2 text-sm font-medium">Rules</TabsTrigger>
              <TabsTrigger value="metafields" className="w-full justify-start px-3 py-2 text-sm font-medium">Metafields</TabsTrigger>
              <TabsTrigger value="metaobjects" className="w-full justify-start px-3 py-2 text-sm font-medium">Metaobjects</TabsTrigger>
              <TabsTrigger value="number-ranges" className="w-full justify-start px-3 py-2 text-sm font-medium">Number Ranges</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto bg-background">
            <div className="h-full p-6">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loading size="lg" variant="centered" text="Loading settings..." />
                </div>
              ) : (
                <div className="max-w-4xl">
                  <TabsContent value="general" className="space-y-8 mt-0">
                    {/* Basic Information */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage your basic store information and contact details.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Store Name</Label>
                          <Input
                            placeholder="My Awesome Shop"
                            value={settings.storeName || ''}
                            onChange={e => handleChange('storeName', e.target.value)}
                            className="bg-gray-50/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Store Email</Label>
                          <Input
                            type="email"
                            placeholder="contact@yourstore.com"
                            value={settings.storeEmail || ''}
                            onChange={e => handleChange('storeEmail', e.target.value)}
                            className="bg-gray-50/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Store Phone</Label>
                          <Input
                            placeholder="+1 (555) 000-0000"
                            value={settings.storePhone || ''}
                            onChange={e => handleChange('storePhone', e.target.value)}
                            className="bg-gray-50/50"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium">Store Address</Label>
                          <Textarea
                            placeholder="123 Shopping St, Retail City, 12345"
                            value={settings.storeAddress || ''}
                            onChange={e => handleChange('storeAddress', e.target.value)}
                            className="bg-gray-50/50 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Regional Settings</h3>
                        <p className="text-sm text-muted-foreground mt-1">Configure your store's currency and time zones.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Currency</Label>
                          <Select
                            value={settings.currency || 'USD'}
                            onValueChange={(val: string) => handleChange('currency', val)}
                          >
                            <SelectTrigger className="bg-gray-50/50">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonCurrencies.map(curr => (
                                <SelectItem key={curr.value} value={curr.value}>
                                  {curr.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Timezone</Label>
                          <Select
                            value={settings.timezone || 'UTC'}
                            onValueChange={(val: string) => handleChange('timezone', val)}
                          >
                            <SelectTrigger className="bg-gray-50/50">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonTimezones.map(tz => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tax" className="space-y-6 mt-0 h-full">
                    <TaxManager settings={settings} onChange={handleChange} />
                  </TabsContent>

                  <TabsContent value="payment" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-lg font-medium">Payment Providers</h3>
                      <p className="text-sm text-muted-foreground">Configure how you accept payments.</p>
                    </div>
                    <div className="space-y-6">
                      {/* Cash on Delivery */}
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Cash on Delivery</Label>
                            <div className="text-sm text-muted-foreground">Enable cash payments upon delivery</div>
                          </div>
                          <Switch
                            checked={!!settings.cashOnDeliveryEnabled}
                            onCheckedChange={checked => handleChange('cashOnDeliveryEnabled', checked)}
                          />
                        </div>
                        {!!settings.cashOnDeliveryEnabled && (
                          <div className="pl-4 border-l-2 space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label>Availability Rule (Negative Logic)</Label>
                              <RuleSelector
                                value={settings.codAvailabilityRuleId}
                                onChange={val => handleChange('codAvailabilityRuleId', val)}
                                moduleType="payment"
                                placeholder="Select exclusion rule..."
                              />
                              <p className="text-[10px] text-muted-foreground">If Rule is TRUE, COD will be HIDDEN.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stripe */}
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Stripe</Label>
                            <div className="text-sm text-muted-foreground">Accept credit card payments via Stripe</div>
                          </div>
                          <Switch
                            checked={!!settings.stripeEnabled}
                            onCheckedChange={checked => handleChange('stripeEnabled', checked)}
                          />
                        </div>
                        {!!settings.stripeEnabled && (
                          <div className="pl-4 border-l-2 space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label>Availability Rule</Label>
                              <RuleSelector
                                value={settings.stripeAvailabilityRuleId}
                                onChange={val => handleChange('stripeAvailabilityRuleId', val)}
                                moduleType="payment"
                                placeholder="Select condition for Stripe..."
                              />
                              <p className="text-[10px] text-muted-foreground">Rule must be TRUE for Stripe to appear.</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Publishable Key</Label>
                              <Input
                                value={settings.stripePublishableKey || ''}
                                onChange={e => handleChange('stripePublishableKey', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Secret Key</Label>
                              <Input
                                type="password"
                                value={settings.stripeSecretKey || ''}
                                onChange={e => handleChange('stripeSecretKey', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="shipping" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-lg font-medium">Shipping</h3>
                      <p className="text-sm text-muted-foreground">Manage shipping zones and rates.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Free Shipping Threshold ($)</Label>
                        <Input
                          type="number"
                          value={settings.freeShippingThreshold || 0}
                          onChange={e => handleChange('freeShippingThreshold', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Shipping Rate ($)</Label>
                        <Input
                          type="number"
                          value={settings.defaultShippingRate || 0}
                          onChange={e => handleChange('defaultShippingRate', Number(e.target.value))}
                        />
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-2">Advanced Shipping Logic</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Availability Rule</Label>
                            <RuleSelector
                              value={settings.shippingAvailabilityRuleId}
                              onChange={val => handleChange('shippingAvailabilityRuleId', val)}
                              moduleType="shipping"
                              placeholder="Condition for default shipping..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Surcharge Rule</Label>
                            <RuleSelector
                              value={settings.shippingSurchargeRuleId}
                              onChange={val => handleChange('shippingSurchargeRuleId', val)}
                              moduleType="shipping"
                              placeholder="Apply surcharge if..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-lg font-medium">Notifications</h3>
                      <p className="text-sm text-muted-foreground">Manage email and system alerts.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Order Confirmation Email</Label>
                        <Switch
                          checked={settings.orderConfirmation || false}
                          onCheckedChange={checked => handleChange('orderConfirmation', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Low Stock Alerts</Label>
                        <Switch
                          checked={settings.lowStockAlert || false}
                          onCheckedChange={checked => handleChange('lowStockAlert', checked)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="users" className="h-full mt-0">
                    <UsersManager />
                  </TabsContent>

                  <TabsContent value="security" className="h-full mt-0 space-y-6">
                    <TwoFactorSettings />
                  </TabsContent>

                  <TabsContent value="rules" className="h-full mt-0">
                    <RuleManager />
                  </TabsContent>

                  <TabsContent value="metafields" className="h-full mt-0">
                    <MetafieldDefinitionsManager />
                  </TabsContent>

                  <TabsContent value="metaobjects" className="h-full mt-0">
                    <MetaobjectDefinitionsManager />
                  </TabsContent>

                  <TabsContent value="number-ranges" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-lg font-medium">Number Ranges</h3>
                      <p className="text-sm text-muted-foreground">Configure automatic number generation for orders and products.</p>
                    </div>

                    <div className="space-y-6">
                      {settings.ranges && settings.ranges.map((range: any, index: number) => (
                        <div key={range.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold capitalize">{range.type} Numbers</h4>
                            <span className="text-xs text-muted-foreground">Last updated: {new Date(range.updated_at).toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Prefix</Label>
                              <Input
                                value={range.prefix || ''}
                                onChange={(e) => {
                                  const newRanges = [...settings.ranges]
                                  newRanges[index].prefix = e.target.value
                                  handleChange('ranges', newRanges)
                                }}
                                placeholder="e.g. ORD-"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Start Value</Label>
                              <Input
                                type="number"
                                value={range.start_value}
                                onChange={(e) => {
                                  const newRanges = [...settings.ranges]
                                  newRanges[index].start_value = parseInt(e.target.value) || 0
                                  handleChange('ranges', newRanges)
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Current Value</Label>
                              <Input
                                type="number"
                                value={range.current_value || 0}
                                onChange={(e) => {
                                  const newRanges = [...settings.ranges]
                                  newRanges[index].current_value = parseInt(e.target.value) || 0
                                  handleChange('ranges', newRanges)
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Suffix</Label>
                              <Input
                                value={range.suffix || ''}
                                onChange={(e) => {
                                  const newRanges = [...settings.ranges]
                                  newRanges[index].suffix = e.target.value
                                  handleChange('ranges', newRanges)
                                }}
                                placeholder="e.g. -2024"
                              />
                            </div>
                          </div>

                          <div className="bg-muted p-2 rounded text-sm text-muted-foreground">
                            Preview: <strong>{range.prefix}{(range.current_value + 1)}{range.suffix}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      <div className="flex justify-end">
        {activeTab !== 'users' && activeTab !== 'security' && activeTab !== 'rules' && activeTab !== 'metafields' && activeTab !== 'metaobjects' && (
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </div>
  )
}
