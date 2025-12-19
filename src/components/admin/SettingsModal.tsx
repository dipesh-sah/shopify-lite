'use client'

import { useState, useEffect } from 'react'
import { getSettingsAction, updateSettingsAction, getNumberRangesAction, updateNumberRangeAction } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import dynamic from 'next/dynamic'
import { UsersManager } from './UsersManager'
import { TaxManager } from './TaxManager'
import { RuleManager } from './rules/RuleManager'
import { RuleSelector } from './rules/RuleSelector'
import { MetafieldDefinitionsManager } from './metadata/MetafieldDefinitionsManager'
import { MetaobjectDefinitionsManager } from './metadata/MetaobjectDefinitionsManager'
const TwoFactorSettings = dynamic(() => import('./TwoFactorSettings').then(mod => mod.TwoFactorSettings), {
  ssr: false,
  loading: () => <Loader2 className="h-6 w-6 animate-spin" />
})

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})

  // Fetch settings when tab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings(activeTab)
    }
  }, [isOpen, activeTab])

  async function loadSettings(category: string) {
    if (category === 'users') {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (category === 'content') {
        const hero = await getSettingsAction('hero')
        const faq = await getSettingsAction('faq')
        setSettings({ ...hero, faqs: faq?.items || [] })
      } else if (category === 'number-ranges') {
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
      if (activeTab === 'content') {
        // Split settings back into hero and faq
        const { faqs, ...heroSettings } = settings
        await updateSettingsAction('hero', heroSettings)
        await updateSettingsAction('faq', { items: faqs })
      } else if (activeTab === 'number-ranges') {
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
      onClose()
    } catch (error) {
      console.error('Failed to save settings', error)
      alert("Failed to save settings. You might not have permission.")
    } finally {
      setSaving(false)
    }
  }

  function handleChange(key: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Store Settings</DialogTitle>
          <DialogDescription>
            Manage your store configuration and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r bg-muted/10">
            <TabsList className="flex flex-col h-full items-start justify-start w-full bg-transparent p-2 space-y-1">
              <TabsTrigger value="general" className="w-full justify-start px-3 py-2 text-sm font-medium">General</TabsTrigger>
              <TabsTrigger value="tax" className="w-full justify-start px-3 py-2 text-sm font-medium">Taxes</TabsTrigger>
              <TabsTrigger value="payment" className="w-full justify-start px-3 py-2 text-sm font-medium">Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="w-full justify-start px-3 py-2 text-sm font-medium">Shipping</TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2 text-sm font-medium">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="w-full justify-start px-3 py-2 text-sm font-medium">Security</TabsTrigger>
              <TabsTrigger value="content" className="w-full justify-start px-3 py-2 text-sm font-medium">Content</TabsTrigger>
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
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <TabsContent value="general" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">General Settings</h3>
                        <p className="text-sm text-muted-foreground">Manage your basic store information.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Store Name</Label>
                          <Input
                            value={settings.storeName || ''}
                            onChange={e => handleChange('storeName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Store Email</Label>
                          <Input
                            value={settings.storeEmail || ''}
                            onChange={e => handleChange('storeEmail', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Input
                            value={settings.currency || 'USD'}
                            onChange={e => handleChange('currency', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Input
                            value={settings.timezone || 'UTC'}
                            onChange={e => handleChange('timezone', e.target.value)}
                          />
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Cash on Delivery</Label>
                          <div className="text-sm text-muted-foreground">Enable cash payments upon delivery</div>
                        </div>
                        <Switch
                          checked={settings.cashOnDeliveryEnabled || false}
                          onCheckedChange={checked => handleChange('cashOnDeliveryEnabled', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Stripe</Label>
                          <div className="text-sm text-muted-foreground">Accept credit card payments via Stripe</div>
                        </div>
                        <Switch
                          checked={settings.stripeEnabled || false}
                          onCheckedChange={checked => handleChange('stripeEnabled', checked)}
                        />
                      </div>
                      {settings.stripeEnabled && (
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
                      {settings.cashOnDeliveryEnabled && (
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

                  <TabsContent value="content" className="space-y-6 mt-0 h-full">
                    <div>
                      <h3 className="text-lg font-medium">Content & Storefront</h3>
                      <p className="text-sm text-muted-foreground">Customize your store's appearance and content.</p>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                      <h3 className="text-lg font-medium">Hero Section</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={settings.heroTitle || ''}
                            onChange={e => handleChange('heroTitle', e.target.value)}
                            placeholder="e.g. The future of healing"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtitle</Label>
                          <Input
                            value={settings.heroSubtitle || ''}
                            onChange={e => handleChange('heroSubtitle', e.target.value)}
                            placeholder="Subtitle text"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Button Text</Label>
                          <div className="flex gap-2">
                            <Input
                              value={settings.heroButtonText || ''}
                              onChange={e => handleChange('heroButtonText', e.target.value)}
                              placeholder="Shop Now"
                            />
                            <Input
                              value={settings.heroButtonLink || ''}
                              onChange={e => handleChange('heroButtonLink', e.target.value)}
                              placeholder="/products"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Background Image URL</Label>
                          <Input
                            value={settings.heroImage || ''}
                            onChange={e => handleChange('heroImage', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">FAQs</h3>
                        <Button size="sm" variant="outline" onClick={() => {
                          const currentFaqs = settings.faqs || []
                          handleChange('faqs', [...currentFaqs, { question: '', answer: '' }])
                        }}>
                          Add FAQ
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(settings.faqs || []).map((faq: any, index: number) => (
                          <div key={index} className="flex gap-2 items-start border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={faq.question}
                                onChange={e => {
                                  const newFaqs = [...(settings.faqs || [])]
                                  newFaqs[index].question = e.target.value
                                  handleChange('faqs', newFaqs)
                                }}
                                placeholder="Question"
                              />
                              <Input
                                value={faq.answer}
                                onChange={e => {
                                  const newFaqs = [...(settings.faqs || [])]
                                  newFaqs[index].answer = e.target.value
                                  handleChange('faqs', newFaqs)
                                }}
                                placeholder="Answer"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newFaqs = settings.faqs.filter((_: any, i: number) => i !== index)
                                handleChange('faqs', newFaqs)
                              }}
                            >
                              <span className="text-red-500">×</span>
                            </Button>
                          </div>
                        ))}
                        {(!settings.faqs || settings.faqs.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-2">No FAQs added yet.</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          </div>
        </Tabs>

        {activeTab !== 'users' && activeTab !== 'security' && activeTab !== 'rules' && activeTab !== 'metafields' && activeTab !== 'metaobjects' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
