"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  RotateCcw,
  Search,
  ChevronRight,
  Info,
  Palette,
  Type,
  ShoppingBag,
  Image as ImageIcon,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  AlertCircle,
  Undo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { themeSettingsSchema, ThemeSettings } from "@/types/theme";
import { ColorPicker } from "@/components/admin/theme-settings/ColorPicker";
import { MediaUploader } from "@/components/admin/theme-settings/MediaUploader";

export default function ThemeSettingsPage() {
  const { settings, updateSettings, resetToDefault } = useThemeStore();
  const [activeSection, setActiveSection] = useState("info");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ThemeSettings>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: settings,
  });

  // Watch for changes to update preview (mocked)
  const watchedValues = form.watch();

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = async (data: ThemeSettings) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      updateSettings(data);
      toast({
        title: "Success",
        description: "Theme settings saved successfully!",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save theme settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: "info", title: "Theme Information", icon: Info },
    { id: "colors", title: "Colors", icon: Palette },
    { id: "status-colors", title: "Status Colors", icon: AlertCircle },
    { id: "typography", title: "Typography", icon: Type },
    { id: "ecommerce", title: "E-commerce Styles", icon: ShoppingBag },
    { id: "media", title: "Media & Icons", icon: ImageIcon },
  ];



  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -m-6">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Theme Settings</h1>
          <Badge variant="outline" className="font-normal">v{watchedValues.info.version}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to reset all settings to default?")) {
                resetToDefault();
              }
            }}
            type="button"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r bg-muted/5 p-4 hidden md:block">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  const element = document.getElementById(section.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.title}
                <ChevronRight className={cn(
                  "ml-auto h-4 w-4 opacity-50 transition-transform",
                  activeSection === section.id && "rotate-90"
                )} />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex">
          <ScrollArea className="flex-1 p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-10 pb-20">

                {/* Theme Information Section */}
                <section id="info" className={cn("space-y-4", activeSection !== "info" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Theme Information</h2>
                    <p className="text-sm text-muted-foreground">Manage the metadata of your theme.</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6 grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="info.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="info.version"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Version</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="info.author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="info.description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                {/* Colors Section */}
                <section id="colors" className={cn("space-y-4", activeSection !== "colors" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Theme Colors</h2>
                    <p className="text-sm text-muted-foreground">Customize the primary and secondary colors of your store.</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="colors.primary"
                        render={({ field }) => (
                          <FormItem>
                            <ColorPicker
                              label="Primary Color"
                              value={field.value}
                              onChange={field.onChange}
                              description="Main color for buttons and links"
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colors.secondary"
                        render={({ field }) => (
                          <FormItem>
                            <ColorPicker
                              label="Secondary Color"
                              value={field.value}
                              onChange={field.onChange}
                              description="Used for accents and badges"
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colors.border"
                        render={({ field }) => (
                          <FormItem>
                            <ColorPicker
                              label="Border Color"
                              value={field.value}
                              onChange={field.onChange}
                              description="Used for dividers and cards"
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colors.background"
                        render={({ field }) => (
                          <FormItem>
                            <ColorPicker
                              label="Background Color"
                              value={field.value}
                              onChange={field.onChange}
                              description="The main page background"
                            />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                {/* Status Colors Section */}
                <section id="status-colors" className={cn("space-y-4", activeSection !== "status-colors" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Status Colors</h2>
                    <p className="text-sm text-muted-foreground">Colors for messages, alerts, and feedback.</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="statusColors.success"
                        render={({ field }) => <ColorPicker label="Success" value={field.value} onChange={field.onChange} />}
                      />
                      <FormField
                        control={form.control}
                        name="statusColors.info"
                        render={({ field }) => <ColorPicker label="Info" value={field.value} onChange={field.onChange} />}
                      />
                      <FormField
                        control={form.control}
                        name="statusColors.notice"
                        render={({ field }) => <ColorPicker label="Notice" value={field.value} onChange={field.onChange} />}
                      />
                      <FormField
                        control={form.control}
                        name="statusColors.error"
                        render={({ field }) => <ColorPicker label="Error" value={field.value} onChange={field.onChange} />}
                      />
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                {/* Typography Section */}
                <section id="typography" className={cn("space-y-4", activeSection !== "typography" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Typography</h2>
                    <p className="text-sm text-muted-foreground">Define fonts and text colors for headings and body content.</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6 grid gap-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="typography.bodyFont"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Font (Google Fonts)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="typography.headingFont"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Heading Font (Google Fonts)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="typography.textColor"
                          render={({ field }) => <ColorPicker label="Body Text Color" value={field.value} onChange={field.onChange} />}
                        />
                        <FormField
                          control={form.control}
                          name="typography.headingColor"
                          render={({ field }) => <ColorPicker label="Heading Text Color" value={field.value} onChange={field.onChange} />}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                {/* E-commerce Styles Section */}
                <section id="ecommerce" className={cn("space-y-4", activeSection !== "ecommerce" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">E-commerce Styles</h2>
                    <p className="text-sm text-muted-foreground">Specific styles for product listings and buy buttons.</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ecommerce.priceColor"
                        render={({ field }) => <ColorPicker label="Price Color" value={field.value} onChange={field.onChange} />}
                      />
                      <FormField
                        control={form.control}
                        name="ecommerce.buyButtonColor"
                        render={({ field }) => <ColorPicker label="Buy Button Color" value={field.value} onChange={field.onChange} />}
                      />
                      <FormField
                        control={form.control}
                        name="ecommerce.buyButtonTextColor"
                        render={({ field }) => <ColorPicker label="Buy Button Text Color" value={field.value} onChange={field.onChange} />}
                      />
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                {/* Media Section */}
                <section id="media" className={cn("space-y-4", activeSection !== "media" && "hidden md:block opacity-40 grayscale pointer-events-none")}>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Media & Icons</h2>
                    <p className="text-sm text-muted-foreground">Upload your store logos and icons for different devices.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="media.logoDesktop"
                      render={({ field }) => (
                        <Card>
                          <CardContent className="pt-6">
                            <MediaUploader label="Desktop Logo" value={field.value} onChange={field.onChange} description="Recommended: 200x50px" />
                          </CardContent>
                        </Card>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="media.logoTablet"
                      render={({ field }) => (
                        <Card>
                          <CardContent className="pt-6">
                            <MediaUploader label="Tablet Logo" value={field.value} onChange={field.onChange} />
                          </CardContent>
                        </Card>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="media.logoMobile"
                      render={({ field }) => (
                        <Card>
                          <CardContent className="pt-6">
                            <MediaUploader label="Mobile Logo" value={field.value} onChange={field.onChange} />
                          </CardContent>
                        </Card>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="media.appIcon"
                      render={({ field }) => (
                        <Card>
                          <CardContent className="pt-6">
                            <MediaUploader label="App Icon" value={field.value} onChange={field.onChange} aspectRatio="square" description="512x512px PNG" />
                          </CardContent>
                        </Card>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="media.favicon"
                      render={({ field }) => (
                        <Card>
                          <CardContent className="pt-6">
                            <MediaUploader label="Favicon" value={field.value} onChange={field.onChange} aspectRatio="square" description="32x32px .ico or .png" />
                          </CardContent>
                        </Card>
                      )}
                    />
                  </div>
                </section>

              </form>
            </Form>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}


