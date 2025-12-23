"use client";

import React, { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useThemeStore();

  useEffect(() => {
    // 1. Inject CSS Variables for Colors
    const root = document.documentElement;

    // Theme Colors
    root.style.setProperty("--primary", hexToHsl(settings.colors.primary));
    root.style.setProperty("--secondary", hexToHsl(settings.colors.secondary));
    root.style.setProperty("--border", hexToHsl(settings.colors.border));
    root.style.setProperty("--background", hexToHsl(settings.colors.background));

    // Status Colors
    root.style.setProperty("--success", hexToHsl(settings.statusColors.success));
    root.style.setProperty("--info", hexToHsl(settings.statusColors.info));
    root.style.setProperty("--warning", hexToHsl(settings.statusColors.notice));
    root.style.setProperty("--destructive", hexToHsl(settings.statusColors.error));

    // Typography Colors
    root.style.setProperty("--text-main", settings.typography.textColor);
    root.style.setProperty("--text-heading", settings.typography.headingColor);

    // 2. Load Google Fonts
    const fontsToLoad = [settings.typography.bodyFont, settings.typography.headingFont];
    const uniqueFonts = Array.from(new Set(fontsToLoad)).filter(Boolean);

    if (uniqueFonts.length > 0) {
      const fontId = "theme-google-fonts";
      let linkElement = document.getElementById(fontId) as HTMLLinkElement;

      if (!linkElement) {
        linkElement = document.createElement("link");
        linkElement.id = fontId;
        linkElement.rel = "stylesheet";
        document.head.appendChild(linkElement);
      }

      const fontFamilies = uniqueFonts.map(f => f.replace(/\s+/g, "+")).join("&family=");
      linkElement.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;

      // Apply font families to root
      root.style.setProperty("--font-body", `'${settings.typography.bodyFont}', sans-serif`);
      root.style.setProperty("--font-heading", `'${settings.typography.headingFont}', sans-serif`);
    }

    // 3. Update Favicon
    if (settings.media.favicon) {
      let faviconElement = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!faviconElement) {
        faviconElement = document.createElement("link");
        faviconElement.rel = "shortcut icon";
        document.head.appendChild(faviconElement);
      }
      faviconElement.href = settings.media.favicon;
    }
  }, [settings]);

  return <>{children}</>;
}

// Helper to convert HEX to HSL format that Shadcn/Tailwind expects (h s% l%)
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // Convert to [0, 1]
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // h: [0, 360], s: [0, 100], l: [0, 100]
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
