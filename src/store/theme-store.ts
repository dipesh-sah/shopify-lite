import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeSettings, defaultThemeSettings } from "@/types/theme";

interface ThemeState {
  settings: ThemeSettings;
  updateSettings: (settings: Partial<ThemeSettings>) => void;
  updateInfo: (info: Partial<ThemeSettings["info"]>) => void;
  updateColors: (colors: Partial<ThemeSettings["colors"]>) => void;
  updateStatusColors: (statusColors: Partial<ThemeSettings["statusColors"]>) => void;
  updateTypography: (typography: Partial<ThemeSettings["typography"]>) => void;
  updateEcommerce: (ecommerce: Partial<ThemeSettings["ecommerce"]>) => void;
  updateMedia: (media: Partial<ThemeSettings["media"]>) => void;
  resetToDefault: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      settings: defaultThemeSettings,
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      updateInfo: (info) =>
        set((state) => ({
          settings: { ...state.settings, info: { ...state.settings.info, ...info } },
        })),
      updateColors: (colors) =>
        set((state) => ({
          settings: { ...state.settings, colors: { ...state.settings.colors, ...colors } },
        })),
      updateStatusColors: (statusColors) =>
        set((state) => ({
          settings: {
            ...state.settings,
            statusColors: { ...state.settings.statusColors, ...statusColors },
          },
        })),
      updateTypography: (typography) =>
        set((state) => ({
          settings: {
            ...state.settings,
            typography: { ...state.settings.typography, ...typography },
          },
        })),
      updateEcommerce: (ecommerce) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ecommerce: { ...state.settings.ecommerce, ...ecommerce },
          },
        })),
      updateMedia: (media) =>
        set((state) => ({
          settings: { ...state.settings, media: { ...state.settings.media, ...media } },
        })),
      resetToDefault: () => set({ settings: defaultThemeSettings }),
    }),
    {
      name: "theme-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
