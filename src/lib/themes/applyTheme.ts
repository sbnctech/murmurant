/**
 * Apply Theme to Document
 *
 * Sets CSS custom properties on document root based on theme configuration.
 *
 * Charter: P6 (human-first UI)
 */

import type { ClubTheme } from "./types";

/**
 * Applies theme values as CSS custom properties on the document root.
 * This allows components to use var(--theme-primary) etc.
 */
export function applyTheme(theme: ClubTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Colors
  root.style.setProperty("--theme-primary", theme.colors.primary);
  root.style.setProperty("--theme-primary-dark", theme.colors.primaryDark);
  root.style.setProperty("--theme-primary-light", theme.colors.primaryLight);
  root.style.setProperty("--theme-secondary", theme.colors.secondary);
  root.style.setProperty("--theme-secondary-dark", theme.colors.secondaryDark);
  root.style.setProperty("--theme-secondary-light", theme.colors.secondaryLight);
  root.style.setProperty("--theme-accent", theme.colors.accent);
  root.style.setProperty("--theme-background", theme.colors.background);
  root.style.setProperty("--theme-surface", theme.colors.surface);
  root.style.setProperty("--theme-text", theme.colors.text);
  root.style.setProperty("--theme-text-muted", theme.colors.textMuted);
  root.style.setProperty("--theme-border", theme.colors.border);
  root.style.setProperty("--theme-error", theme.colors.error);
  root.style.setProperty("--theme-warning", theme.colors.warning);
  root.style.setProperty("--theme-success", theme.colors.success);
  root.style.setProperty("--theme-info", theme.colors.info);

  // Fonts
  root.style.setProperty("--theme-font-heading", theme.fonts.heading);
  root.style.setProperty("--theme-font-body", theme.fonts.body);
  root.style.setProperty("--theme-font-mono", theme.fonts.mono);

  // Layout
  root.style.setProperty("--theme-border-radius", theme.borderRadius);
  root.style.setProperty("--theme-spacing-xs", theme.spacing.xs);
  root.style.setProperty("--theme-spacing-sm", theme.spacing.sm);
  root.style.setProperty("--theme-spacing-md", theme.spacing.md);
  root.style.setProperty("--theme-spacing-lg", theme.spacing.lg);
  root.style.setProperty("--theme-spacing-xl", theme.spacing.xl);
}

/**
 * Removes all theme CSS custom properties from document root.
 */
export function clearTheme(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const themeProps = [
    "--theme-primary",
    "--theme-primary-dark",
    "--theme-primary-light",
    "--theme-secondary",
    "--theme-secondary-dark",
    "--theme-secondary-light",
    "--theme-accent",
    "--theme-background",
    "--theme-surface",
    "--theme-text",
    "--theme-text-muted",
    "--theme-border",
    "--theme-error",
    "--theme-warning",
    "--theme-success",
    "--theme-info",
    "--theme-font-heading",
    "--theme-font-body",
    "--theme-font-mono",
    "--theme-border-radius",
    "--theme-spacing-xs",
    "--theme-spacing-sm",
    "--theme-spacing-md",
    "--theme-spacing-lg",
    "--theme-spacing-xl",
  ];

  themeProps.forEach((prop) => root.style.removeProperty(prop));
}
