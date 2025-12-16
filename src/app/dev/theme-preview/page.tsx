"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";
import DataTableFrame from "@/components/layout/DataTableFrame";
import FormRow from "@/components/layout/FormRow";

/**
 * Theme Preview Page
 *
 * Development page for previewing theme tokens and components.
 * Access at /dev/theme-preview
 *
 * Use ?theme=base or ?theme=sbnc to switch themes.
 */

const THEMES = ["base", "sbnc"];

export default function ThemePreviewPage() {
  const [currentTheme, setCurrentTheme] = useState("base");

  // Read theme from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");
    if (theme && THEMES.includes(theme)) {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional URL param hydration
      setCurrentTheme(theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, []);

  // Update theme
  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    const url = new URL(window.location.href);
    url.searchParams.set("theme", theme);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div
      data-test-id="theme-preview"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--token-color-background)",
        padding: "var(--token-space-lg)",
        fontFamily: "var(--token-font-sans)",
      }}
    >
      <div style={{ maxWidth: "var(--token-layout-page-max-width)", margin: "0 auto" }}>
        {/* Theme Switcher */}
        <div
          style={{
            marginBottom: "var(--token-space-xl)",
            padding: "var(--token-space-md)",
            backgroundColor: "var(--token-color-surface)",
            borderRadius: "var(--token-radius-lg)",
            border: "1px solid var(--token-color-border)",
          }}
        >
          <h2 style={{ margin: 0, marginBottom: "var(--token-space-sm)" }}>
            Theme: {currentTheme}
          </h2>
          <div style={{ display: "flex", gap: "var(--token-space-sm)" }}>
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                style={{
                  padding: "var(--token-space-sm) var(--token-space-md)",
                  backgroundColor:
                    currentTheme === theme
                      ? "var(--token-color-primary)"
                      : "var(--token-color-surface-2)",
                  color:
                    currentTheme === theme
                      ? "var(--token-color-primary-text)"
                      : "var(--token-color-text)",
                  border: "1px solid var(--token-color-border)",
                  borderRadius: "var(--token-radius-md)",
                  cursor: "pointer",
                  fontWeight: "var(--token-weight-medium)",
                }}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Page Header Demo */}
        <PageHeader
          title="Theme Preview"
          subtitle="Visual preview of all theme tokens and components"
          actions={
            <button
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor: "var(--token-color-primary)",
                color: "var(--token-color-primary-text)",
                border: "none",
                borderRadius: "var(--token-radius-md)",
                cursor: "pointer",
                height: "var(--token-control-button-height)",
              }}
            >
              Primary Button
            </button>
          }
        />

        {/* Color Swatches */}
        <SectionCard title="Colors" subtitle="Theme color tokens">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "var(--token-space-md)" }}>
            <ColorSwatch name="primary" var="--token-color-primary" />
            <ColorSwatch name="primary-hover" var="--token-color-primary-hover" />
            <ColorSwatch name="secondary" var="--token-color-secondary" />
            <ColorSwatch name="accent" var="--token-color-accent" />
            <ColorSwatch name="background" var="--token-color-background" />
            <ColorSwatch name="surface" var="--token-color-surface" />
            <ColorSwatch name="surface-2" var="--token-color-surface-2" />
            <ColorSwatch name="text" var="--token-color-text" />
            <ColorSwatch name="text-muted" var="--token-color-text-muted" />
            <ColorSwatch name="border" var="--token-color-border" />
            <ColorSwatch name="danger" var="--token-color-danger" />
            <ColorSwatch name="success" var="--token-color-success" />
            <ColorSwatch name="warning" var="--token-color-warning" />
          </div>
        </SectionCard>

        {/* Typography */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Typography" subtitle="Font sizes and weights">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-md)" }}>
              <p style={{ fontSize: "var(--token-text-3xl)", margin: 0 }}>Text 3XL - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-2xl)", margin: 0 }}>Text 2XL - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-xl)", margin: 0 }}>Text XL - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-lg)", margin: 0 }}>Text LG - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-base)", margin: 0 }}>Text Base - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-sm)", margin: 0 }}>Text SM - The quick brown fox</p>
              <p style={{ fontSize: "var(--token-text-xs)", margin: 0 }}>Text XS - The quick brown fox</p>
            </div>
          </SectionCard>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Buttons" subtitle="Button styles">
            <div style={{ display: "flex", gap: "var(--token-space-md)", flexWrap: "wrap" }}>
              <button
                style={{
                  padding: "var(--token-space-sm) var(--token-space-md)",
                  backgroundColor: "var(--token-color-primary)",
                  color: "var(--token-color-primary-text)",
                  border: "none",
                  borderRadius: "var(--token-radius-md)",
                  cursor: "pointer",
                  height: "var(--token-control-button-height)",
                  fontWeight: "var(--token-weight-medium)",
                }}
              >
                Primary
              </button>
              <button
                style={{
                  padding: "var(--token-space-sm) var(--token-space-md)",
                  backgroundColor: "var(--token-color-secondary)",
                  color: "var(--token-color-text-inverse)",
                  border: "none",
                  borderRadius: "var(--token-radius-md)",
                  cursor: "pointer",
                  height: "var(--token-control-button-height)",
                  fontWeight: "var(--token-weight-medium)",
                }}
              >
                Secondary
              </button>
              <button
                style={{
                  padding: "var(--token-space-sm) var(--token-space-md)",
                  backgroundColor: "transparent",
                  color: "var(--token-color-primary)",
                  border: "1px solid var(--token-color-primary)",
                  borderRadius: "var(--token-radius-md)",
                  cursor: "pointer",
                  height: "var(--token-control-button-height)",
                  fontWeight: "var(--token-weight-medium)",
                }}
              >
                Outline
              </button>
              <button
                style={{
                  padding: "var(--token-space-sm) var(--token-space-md)",
                  backgroundColor: "var(--token-color-danger)",
                  color: "var(--token-color-text-inverse)",
                  border: "none",
                  borderRadius: "var(--token-radius-md)",
                  cursor: "pointer",
                  height: "var(--token-control-button-height)",
                  fontWeight: "var(--token-weight-medium)",
                }}
              >
                Danger
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Form Elements */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Form Elements" subtitle="Input controls">
            <div style={{ maxWidth: "400px" }}>
              <FormRow label="Text Input" htmlFor="demo-input">
                <input
                  id="demo-input"
                  type="text"
                  placeholder="Enter text..."
                  style={{
                    width: "100%",
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-border)",
                    borderRadius: "var(--token-radius-md)",
                    fontSize: "var(--token-text-base)",
                    height: "var(--token-control-input-height)",
                    backgroundColor: "var(--token-color-surface)",
                    color: "var(--token-color-text)",
                  }}
                />
              </FormRow>
              <FormRow
                label="With Help Text"
                htmlFor="demo-help"
                helpText="This is helpful information about the field."
              >
                <input
                  id="demo-help"
                  type="text"
                  style={{
                    width: "100%",
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-border)",
                    borderRadius: "var(--token-radius-md)",
                    fontSize: "var(--token-text-base)",
                    height: "var(--token-control-input-height)",
                    backgroundColor: "var(--token-color-surface)",
                    color: "var(--token-color-text)",
                  }}
                />
              </FormRow>
              <FormRow
                label="With Error"
                htmlFor="demo-error"
                error="This field has an error."
                required
              >
                <input
                  id="demo-error"
                  type="text"
                  style={{
                    width: "100%",
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-danger)",
                    borderRadius: "var(--token-radius-md)",
                    fontSize: "var(--token-text-base)",
                    height: "var(--token-control-input-height)",
                    backgroundColor: "var(--token-color-surface)",
                    color: "var(--token-color-text)",
                  }}
                />
              </FormRow>
            </div>
          </SectionCard>
        </div>

        {/* Data Table Frame */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Data Table" subtitle="Table frame component">
            <DataTableFrame
              filters={
                <select
                  style={{
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    border: "1px solid var(--token-color-border)",
                    borderRadius: "var(--token-radius-md)",
                    fontSize: "var(--token-text-sm)",
                    backgroundColor: "var(--token-color-surface)",
                    color: "var(--token-color-text)",
                  }}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              }
              pagination={
                <div style={{ fontSize: "var(--token-text-sm)", color: "var(--token-color-text-muted)" }}>
                  Showing 1-10 of 100 items
                </div>
              }
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--token-color-surface-2)" }}>
                    <th style={{ padding: "var(--token-space-sm) var(--token-space-md)", textAlign: "left", fontWeight: "var(--token-weight-semibold)" }}>Name</th>
                    <th style={{ padding: "var(--token-space-sm) var(--token-space-md)", textAlign: "left", fontWeight: "var(--token-weight-semibold)" }}>Status</th>
                    <th style={{ padding: "var(--token-space-sm) var(--token-space-md)", textAlign: "left", fontWeight: "var(--token-weight-semibold)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--token-color-border)" }}>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>John Smith</td>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>
                      <span style={{ color: "var(--token-color-success)" }}>Active</span>
                    </td>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>
                      <a href="#" style={{ color: "var(--token-color-primary)" }}>View</a>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--token-color-border)" }}>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>Jane Doe</td>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>
                      <span style={{ color: "var(--token-color-warning)" }}>Pending</span>
                    </td>
                    <td style={{ padding: "var(--token-space-sm) var(--token-space-md)" }}>
                      <a href="#" style={{ color: "var(--token-color-primary)" }}>View</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </DataTableFrame>
          </SectionCard>
        </div>

        {/* Spacing Scale */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Spacing Scale" subtitle="Spacing tokens">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
              {["xs", "sm", "md", "lg", "xl", "2xl"].map((size) => (
                <div key={size} style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
                  <span style={{ width: "40px", fontSize: "var(--token-text-sm)" }}>{size}</span>
                  <div
                    style={{
                      width: `var(--token-space-${size})`,
                      height: "20px",
                      backgroundColor: "var(--token-color-primary)",
                      borderRadius: "var(--token-radius-sm)",
                    }}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Border Radius */}
        <div style={{ marginTop: "var(--token-space-lg)" }}>
          <SectionCard title="Border Radius" subtitle="Radius tokens">
            <div style={{ display: "flex", gap: "var(--token-space-lg)", flexWrap: "wrap" }}>
              {["sm", "md", "lg", "full"].map((size) => (
                <div key={size} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: "var(--token-color-primary)",
                      borderRadius: `var(--token-radius-${size})`,
                      marginBottom: "var(--token-space-xs)",
                    }}
                  />
                  <span style={{ fontSize: "var(--token-text-sm)" }}>{size}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Shadows */}
        <div style={{ marginTop: "var(--token-space-lg)", marginBottom: "var(--token-space-2xl)" }}>
          <SectionCard title="Shadows" subtitle="Shadow tokens">
            <div style={{ display: "flex", gap: "var(--token-space-xl)", flexWrap: "wrap" }}>
              {["sm", "md", "lg"].map((size) => (
                <div key={size} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "100px",
                      height: "60px",
                      backgroundColor: "var(--token-color-surface)",
                      borderRadius: "var(--token-radius-md)",
                      boxShadow: `var(--token-shadow-${size})`,
                      marginBottom: "var(--token-space-sm)",
                    }}
                  />
                  <span style={{ fontSize: "var(--token-text-sm)" }}>{size}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/**
 * Color Swatch Component
 */
function ColorSwatch({ name, var: cssVar }: { name: string; var: string }) {
  return (
    <div>
      <div
        style={{
          width: "100%",
          height: "60px",
          backgroundColor: `var(${cssVar})`,
          borderRadius: "var(--token-radius-md)",
          border: "1px solid var(--token-color-border)",
          marginBottom: "var(--token-space-xs)",
        }}
      />
      <p style={{ fontSize: "var(--token-text-sm)", margin: 0, fontWeight: "var(--token-weight-medium)" }}>
        {name}
      </p>
      <p style={{ fontSize: "var(--token-text-xs)", margin: 0, color: "var(--token-color-text-muted)" }}>
        {cssVar}
      </p>
    </div>
  );
}
