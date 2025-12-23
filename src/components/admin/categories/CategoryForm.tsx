'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Category, CategoryTranslation } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

const translationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
})

const categorySchema = z.object({
  parentId: z.number().nullable(),
  position: z.number().default(0),
  isActive: z.boolean().default(true),
  hideFromNav: z.boolean().default(false),
  translations: z.record(z.string(), translationSchema),
})

interface CategoryFormProps {
  category?: Category
  locales: string[]
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ category, locales, onSave, onCancel }: CategoryFormProps) {
  const [activeLocale, setActiveLocale] = useState(locales[0])

  const defaultTranslations: Record<string, any> = {}
  locales.forEach(locale => {
    const t = category?.translations[locale]
    defaultTranslations[locale] = {
      name: t?.name || '',
      description: t?.description || '',
      metaTitle: t?.metaTitle || '',
      metaDescription: t?.metaDescription || '',
      slug: t?.slug || '',
    }
  })

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parentId: category?.parentId ? parseInt(category.parentId) : null,
      position: category?.position ?? 0,
      isActive: category?.isActive !== false,
      hideFromNav: !!category?.hideFromNav,
      translations: defaultTranslations,
    },
  })

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    // Transform translations record to array for the API
    const translationsArray = Object.entries(values.translations).map(([locale, t]) => ({
      locale,
      ...t
    }))

    await onSave({
      ...values,
      translations: translationsArray
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">
            {category ? 'Edit Category' : 'New Category'}
          </h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Tabs value={activeLocale} onValueChange={setActiveLocale}>
              <TabsList className="bg-muted">
                {locales.map(locale => (
                  <TabsTrigger key={locale} value={locale}>{locale}</TabsTrigger>
                ))}
              </TabsList>

              {locales.map(locale => (
                <TabsContent key={locale} value={locale} className="space-y-4 pt-4 border rounded-lg p-4 bg-white">
                  <FormField
                    control={form.control}
                    name={`translations.${locale}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name ({locale})</FormLabel>
                        <FormControl>
                          <Input placeholder="Category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`translations.${locale}.slug`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug ({locale})</FormLabel>
                        <FormControl>
                          <Input placeholder="category-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`translations.${locale}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description ({locale})</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Category description" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t space-y-4 text-primary-foreground/80">
                    <h4 className="font-medium text-foreground">SEO Settings ({locale})</h4>
                    <FormField
                      control={form.control}
                      name={`translations.${locale}.metaTitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`translations.${locale}.metaDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-white space-y-4">
              <h4 className="font-medium border-b pb-2">Settings</h4>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>Visible on storefront</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hideFromNav"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Hide from navigation</FormLabel>
                      <FormDescription>Hides from main menu</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
