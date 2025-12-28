/**
 * Print Base Template - Foundation for print-ready documents
 * Charter: P6 (human-first UI), P4 (no hidden rules)
 */

import type { ClubTheme } from "../types";
import { formatClubDateLong } from "@/lib/timezone";

export type PaperSize = "letter" | "a4" | "legal";
export type Orientation = "portrait" | "landscape";

export interface PrintBaseOptions {
  title: string;
  content: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showPageNumbers?: boolean;
  paperSize?: PaperSize;
  orientation?: Orientation;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface PrintStyles {
  body: string;
  heading1: string;
  heading2: string;
  heading3: string;
  paragraph: string;
  table: string;
  tableHeader: string;
  tableCell: string;
  card: string;
  divider: string;
  mutedText: string;
}

/**
 * Get print-optimized CSS styles based on theme
 */
export function getPrintStyles(theme: ClubTheme): PrintStyles {
  const colors = theme.colors;
  const typography = theme.typography;

  const fontFamily = `${typography.fontBody}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  const headingFamily = typography.fontHeading
    ? `${typography.fontHeading}, ${fontFamily}`
    : fontFamily;

  return {
    body: `
      font-family: ${fontFamily};
      font-size: ${typography.baseFontSize}px;
      line-height: ${typography.lineHeight};
      color: #000000;
    `.trim(),
    heading1: `
      font-family: ${headingFamily};
      font-size: 24pt;
      font-weight: 700;
      color: ${colors.primary};
      margin: 0 0 12pt 0;
      page-break-after: avoid;
    `.trim(),
    heading2: `
      font-family: ${headingFamily};
      font-size: 18pt;
      font-weight: 600;
      color: ${colors.primary};
      margin: 16pt 0 8pt 0;
      page-break-after: avoid;
    `.trim(),
    heading3: `
      font-family: ${headingFamily};
      font-size: 14pt;
      font-weight: 600;
      color: #333333;
      margin: 12pt 0 6pt 0;
      page-break-after: avoid;
    `.trim(),
    paragraph: `
      margin: 0 0 10pt 0;
      orphans: 3;
      widows: 3;
    `.trim(),
    table: `
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      page-break-inside: avoid;
    `.trim(),
    tableHeader: `
      background-color: ${colors.primary};
      color: #ffffff;
      font-weight: 600;
      padding: 8pt 10pt;
      text-align: left;
      border: 1pt solid ${colors.primary};
    `.trim(),
    tableCell: `
      padding: 6pt 10pt;
      border: 1pt solid #cccccc;
      vertical-align: top;
    `.trim(),
    card: `
      border: 1pt solid #cccccc;
      padding: 12pt;
      margin: 10pt 0;
      page-break-inside: avoid;
    `.trim(),
    divider: `
      border: none;
      border-top: 1pt solid #cccccc;
      margin: 16pt 0;
    `.trim(),
    mutedText: `
      color: #666666;
      font-size: 10pt;
    `.trim(),
  };
}

/**
 * Get paper size dimensions
 */
function getPaperDimensions(
  size: PaperSize,
  orientation: Orientation
): { width: string; height: string } {
  const sizes = {
    letter: { width: "8.5in", height: "11in" },
    a4: { width: "210mm", height: "297mm" },
    legal: { width: "8.5in", height: "14in" },
  };

  const dimensions = sizes[size];
  if (orientation === "landscape") {
    return { width: dimensions.height, height: dimensions.width };
  }
  return dimensions;
}

/**
 * Generate the base print document structure
 */
export function generatePrintBase(
  theme: ClubTheme,
  options: PrintBaseOptions
): string {
  const {
    title,
    content,
    showHeader = true,
    showFooter = true,
    showPageNumbers = true,
    paperSize = "letter",
    orientation = "portrait",
    margins = { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
  } = options;

  const styles = getPrintStyles(theme);
  const dimensions = getPaperDimensions(paperSize, orientation);
  const clubName = theme.name;
  const now = new Date();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${clubName}</title>
  <style>
    @page {
      size: ${dimensions.width} ${dimensions.height};
      margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
      ${showPageNumbers ? `
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #666666;
      }
      ` : ""}
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .no-print {
        display: none !important;
      }

      .page-break {
        page-break-before: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }
    }

    @media screen {
      body {
        max-width: ${dimensions.width};
        margin: 20px auto;
        padding: 40px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        background: white;
      }

      .page-break {
        border-top: 2px dashed #ccc;
        margin: 40px 0;
        padding-top: 40px;
      }
    }

    body {
      ${styles.body}
    }

    h1 { ${styles.heading1} }
    h2 { ${styles.heading2} }
    h3 { ${styles.heading3} }
    p { ${styles.paragraph} }

    table { ${styles.table} }
    th { ${styles.tableHeader} }
    td { ${styles.tableCell} }

    .card { ${styles.card} }
    hr { ${styles.divider} }
    .muted { ${styles.mutedText} }

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12pt;
      border-bottom: 2pt solid ${theme.colors.primary};
      margin-bottom: 20pt;
    }

    .print-header-logo {
      max-height: 50pt;
      max-width: 200pt;
    }

    .print-header-title {
      font-size: 20pt;
      font-weight: 700;
      color: ${theme.colors.primary};
      margin: 0;
    }

    .print-header-date {
      ${styles.mutedText}
      text-align: right;
    }

    .print-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding-top: 10pt;
      border-top: 1pt solid #cccccc;
      ${styles.mutedText}
      text-align: center;
    }

    .print-content {
      min-height: calc(100vh - 200pt);
    }
  </style>
</head>
<body>
  ${showHeader ? `
  <header class="print-header">
    <div>
      ${theme.logo ? `<img src="${theme.logo.url}" alt="${theme.logo.alt}" class="print-header-logo">` : `<h1 class="print-header-title">${clubName}</h1>`}
    </div>
    <div class="print-header-date">
      <div>${title}</div>
      <div>Printed: ${formatClubDateLong(now)}</div>
    </div>
  </header>
  ` : ""}

  <main class="print-content">
    ${content}
  </main>

  ${showFooter ? `
  <footer class="print-footer">
    ${clubName} &bull; Printed ${formatClubDateLong(now)}
  </footer>
  ` : ""}
</body>
</html>`;
}

/**
 * Wrap content in a page container with optional break before
 */
export function wrapInPage(content: string, breakBefore = false): string {
  return `
    <div class="${breakBefore ? "page-break" : ""} avoid-break">
      ${content}
    </div>
  `;
}

/**
 * Add a page break
 */
export function addPageBreak(): string {
  return '<div class="page-break"></div>';
}
