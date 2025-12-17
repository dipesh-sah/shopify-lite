import { showToast } from "./Toast"

export function useToast() {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      showToast(
        title && description ? `${title}: ${description}` : title || description || "",
        variant === "destructive" ? "error" : "success"
      )
    },
  }
}
