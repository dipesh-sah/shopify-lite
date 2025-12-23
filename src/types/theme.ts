import { z } from "zod";

export const themeSettingsSchema = z.object({
  info: z.object({
    name: z.string().min(1, "Theme name is required"),
    version: z.string().min(1, "Version is required"),
    author: z.string().optional(),
    description: z.string().optional(),
  }),
  salesChannels: z.array(z.string()).min(1, "Select at least one sales channel"),
  colors: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    border: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
  }),
  statusColors: z.object({
    success: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    info: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    notice: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    error: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
  }),
  typography: z.object({
    bodyFont: z.string(),
    headingFont: z.string(),
    textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    headingColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
  }),
  ecommerce: z.object({
    priceColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    buyButtonColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
    buyButtonTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color"),
  }),
  media: z.object({
    logoDesktop: z.string().optional(),
    logoTablet: z.string().optional(),
    logoMobile: z.string().optional(),
    appIcon: z.string().optional(),
    favicon: z.string().optional(),
  }),
});

export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

export const defaultThemeSettings: ThemeSettings = {
  info: {
    name: "Default Theme",
    version: "1.0.0",
    author: "Admin",
    description: "Standard e-commerce theme for Shopware/Shopify style store.",
  },
  salesChannels: ["Main Store"],
  colors: {
    primary: "#0055ff",
    secondary: "#6b7280",
    border: "#e5e7eb",
    background: "#ffffff",
  },
  statusColors: {
    success: "#10b981",
    info: "#3b82f6",
    notice: "#f59e0b",
    error: "#ef4444",
  },
  typography: {
    bodyFont: "Inter",
    headingFont: "Inter",
    textColor: "#1f2937",
    headingColor: "#111827",
  },
  ecommerce: {
    priceColor: "#111827",
    buyButtonColor: "#0055ff",
    buyButtonTextColor: "#ffffff",
  },
  media: {
    logoDesktop: "",
    logoTablet: "",
    logoMobile: "",
    appIcon: "",
    favicon: "",
  },
};
