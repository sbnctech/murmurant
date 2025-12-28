/**
 * ClubOS Design Tokens - TypeScript Exports
 * Copyright (c) Santa Barbara Newcomers Club
 */

export const colors = {
  brand: { primary: "#4F46E5", secondary: "#7C3AED", warm: "#F59E0B" },
  semantic: { success: "#10B981", warning: "#F59E0B", error: "#F43F5E", info: "#3B82F6" },
  neutral: { 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 500: "#64748B", 700: "#334155", 900: "#0F172A" },
} as const;

export const typography = {
  fontFamily: { sans: "ui-sans-serif, system-ui", serif: "ui-serif, Georgia", mono: "ui-monospace" },
  fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem" },
} as const;

export const spacing = { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" } as const;
export const shadows = { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" } as const;
export const borders = { radius: { sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" } } as const;
export const motion = { duration: { fast: "150ms", normal: "200ms", slow: "300ms" } } as const;
export const breakpoints = { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" } as const;
export const zIndex = { dropdown: 1000, modal: 1400, tooltip: 1600, toast: 1700 } as const;

export function cssVar(...path: string[]): string {
  return `var(--${path.join("-")})`;
}
