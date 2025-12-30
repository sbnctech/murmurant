/**
 * HTML Pattern Analyzer
 *
 * Detects common HTML patterns (social links, navigation, etc.) and
 * suggests native Murmurant widgets to replace them.
 *
 * Charter: P4 (no hidden rules), P6 (human-first UI)
 */

// ============================================================================
// Types
// ============================================================================

export interface HtmlPatternMatch {
  /** Pattern type identified */
  pattern: HtmlPatternType;
  /** Human-readable description */
  description: string;
  /** Confidence level 0-1 */
  confidence: number;
  /** The replacement suggestion */
  replacement: HtmlReplacement;
  /** Extracted data from the pattern */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractedData: Record<string, any>;
  /** Original HTML snippet */
  originalHtml: string;
}

export type HtmlPatternType =
  | "social-links"      // Social media follow links
  | "social-share"      // Social sharing buttons
  | "contact-info"      // Address, phone, email
  | "image-gallery"     // Grid of images
  | "single-image"      // Single image
  | "photo-album"       // Camera.js photo gallery
  | "staff-grid"        // Team/staff photos with names
  | "pricing-table"     // Membership or product pricing
  | "feature-list"      // Icon + text feature lists
  | "testimonial"       // Quote with attribution
  | "call-to-action"    // CTA button with text
  | "embed-video"       // YouTube/Vimeo embed
  | "google-map"        // Google Maps embed
  | "table-data"        // Data table
  | "content-divider"   // Horizontal divider/separator
  | "accent-heading"    // Heading with brand color
  | "list-content"      // Bulleted or numbered list
  | "link-list"         // Multiple links grouped together
  | "empty-spacer"      // Empty content (should be removed)
  | "simple-text"       // Simple text/paragraph block
  | "simple-heading"    // Simple heading block
  | "wa-system-widget"  // WA system widget (login, nav, mobile, search)
  | "wa-events"         // WA upcoming events widget
  | "wa-store"          // WA online store widget (unsupported)
  | "unknown";

export interface HtmlReplacement {
  /** Type of replacement */
  type: "widget" | "block" | "remove" | "simplify";
  /** Specific widget/block type */
  widgetType?: string;
  /** What to tell the user */
  action: string;
  /** Can this be auto-applied? */
  autoApply: boolean;
  /** The new block data if auto-applicable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockData?: Record<string, any>;
}

// ============================================================================
// Social Links Pattern
// ============================================================================

interface SocialLink {
  platform: string;
  url: string;
  title?: string;
}

const SOCIAL_PLATFORMS: Record<string, { pattern: RegExp; name: string }> = {
  facebook: { pattern: /facebook\.com/i, name: "Facebook" },
  twitter: { pattern: /twitter\.com|x\.com/i, name: "X (Twitter)" },
  instagram: { pattern: /instagram\.com/i, name: "Instagram" },
  linkedin: { pattern: /linkedin\.com/i, name: "LinkedIn" },
  youtube: { pattern: /youtube\.com/i, name: "YouTube" },
  pinterest: { pattern: /pinterest\.com/i, name: "Pinterest" },
  tiktok: { pattern: /tiktok\.com/i, name: "TikTok" },
  threads: { pattern: /threads\.net/i, name: "Threads" },
  bluesky: { pattern: /bsky\.app/i, name: "Bluesky" },
};

function detectSocialLinks(html: string): SocialLink[] {
  const links: SocialLink[] = [];

  // Match anchor tags with href
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2];

    for (const [key, { pattern, name }] of Object.entries(SOCIAL_PLATFORMS)) {
      if (pattern.test(url)) {
        links.push({
          platform: key,
          url,
          title: name,
        });
        break;
      }
    }
  }

  // Also check for class-based social links (like the WA pattern)
  const classRegex = /class=["'][^"']*\b(facebook|twitter|instagram|linkedin|youtube|pinterest|x)\b[^"']*["']/gi;
  while ((match = classRegex.exec(html)) !== null) {
    const platform = match[1].toLowerCase();
    // Find the associated href
    const hrefMatch = html.substring(Math.max(0, match.index - 200), match.index + 200)
      .match(/href=["']([^"']+)["']/i);
    if (hrefMatch && !links.find(l => l.url === hrefMatch[1])) {
      const platformName = platform === 'x' ? 'twitter' : platform;
      links.push({
        platform: platformName,
        url: hrefMatch[1],
        title: SOCIAL_PLATFORMS[platformName]?.name || platform,
      });
    }
  }

  return links;
}

// ============================================================================
// Contact Info Pattern
// ============================================================================

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

function detectContactInfo(html: string): ContactInfo | null {
  const info: ContactInfo = {};

  // Email
  const emailMatch = html.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) info.email = emailMatch[0];

  // Phone (various formats)
  const phoneMatch = html.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) info.phone = phoneMatch[0];

  // Address (look for common patterns)
  const addressMatch = html.match(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|boulevard|blvd)[,.\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/i);
  if (addressMatch) info.address = addressMatch[0];

  if (info.email || info.phone || info.address) {
    return info;
  }
  return null;
}

// ============================================================================
// Image Gallery Pattern
// ============================================================================

interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

function detectImageGallery(html: string): GalleryImage[] {
  const images: GalleryImage[] = [];

  // Look for multiple images in a container
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    images.push({
      src: match[1],
      alt: match[2] || undefined,
    });
  }

  return images;
}

// ============================================================================
// Video Embed Pattern
// ============================================================================

interface VideoEmbed {
  platform: "youtube" | "vimeo" | "other";
  url: string;
  videoId?: string;
}

function detectVideoEmbed(html: string): VideoEmbed | null {
  // YouTube
  const youtubeMatch = html.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtubeMatch) {
    return {
      platform: "youtube",
      url: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      videoId: youtubeMatch[1],
    };
  }

  // Vimeo
  const vimeoMatch = html.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return {
      platform: "vimeo",
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      videoId: vimeoMatch[1],
    };
  }

  return null;
}

// ============================================================================
// CTA Button Pattern
// ============================================================================

interface CtaButton {
  text: string;
  href: string;
  waClass?: string;
  variant: "primary" | "secondary" | "outline";
}

function detectCtaButtons(html: string): CtaButton[] {
  const buttons: CtaButton[] = [];

  // WA stylized buttons: class="stylizedButton buttonStyle002"
  const buttonRegex = /<a[^>]*class=["'][^"']*stylizedButton\s+(buttonStyle\d+)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = buttonRegex.exec(html)) !== null) {
    const waClass = match[1];
    const href = match[2];
    // Strip nested font tags from button text
    const text = match[3]
      .replace(/<\/?font[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();

    buttons.push({
      text,
      href,
      waClass,
      // First button style found is usually primary
      variant: buttons.length === 0 ? "primary" : "secondary",
    });
  }

  // Also match reverse order (href before class)
  const buttonRegex2 = /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*stylizedButton\s+(buttonStyle\d+)[^"']*["'][^>]*>([^<]+)<\/a>/gi;
  while ((match = buttonRegex2.exec(html)) !== null) {
    const href = match[1];
    const waClass = match[2];
    const text = match[3]
      .replace(/<\/?font[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();

    // Skip if we already found this button
    if (buttons.some((b) => b.href === href)) continue;

    buttons.push({
      text,
      href,
      waClass,
      variant: buttons.length === 0 ? "primary" : "secondary",
    });
  }

  return buttons;
}

// ============================================================================
// Content Divider Pattern
// ============================================================================

interface ContentDivider {
  style: "solid" | "dashed" | "dotted" | "gradient";
  color?: string;
}

function detectContentDivider(html: string): ContentDivider | null {
  // WA dividers use a base64 transparent gif with border styling
  // <img ... class="WaContentDivider ... divider_style_border_solid" style="border-top-width: 1px; border-color: rgb(234, 234, 234);">
  const dividerMatch = html.match(
    /class=["'][^"']*WaContentDivider[^"']*divider_style_border_(\w+)[^"']*["']/i
  );

  if (dividerMatch) {
    const style = dividerMatch[1].toLowerCase() as ContentDivider["style"];

    // Extract color if present
    const colorMatch = html.match(/border-color\s*:\s*([^;}"']+)/i);
    let color: string | undefined;
    if (colorMatch) {
      color = colorMatch[1].trim();
    }

    return { style: style || "solid", color };
  }

  // Also detect <hr> tags
  if (/<hr\s*\/?>/i.test(html)) {
    return { style: "solid" };
  }

  return null;
}

// ============================================================================
// Accent Heading Pattern (heading with brand color)
// ============================================================================

interface AccentHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  color: string;
  alignment?: "left" | "center" | "right";
}

function detectAccentHeading(html: string): AccentHeading | null {
  // Pattern: <h2><font color="#BED600">Title</font></h2>
  // or: <h2 style="..."><font color="...">Title</font></h2>
  const headingMatch = html.match(
    /<h([1-6])[^>]*>[\s\S]*?<font[^>]*color=["']([^"']+)["'][^>]*>([^<]+)<\/font>[\s\S]*?<\/h\1>/i
  );

  if (headingMatch) {
    const level = parseInt(headingMatch[1], 10) as AccentHeading["level"];
    const color = headingMatch[2];
    const text = headingMatch[3].trim();

    // Check alignment
    let alignment: AccentHeading["alignment"];
    if (/align=["']center["']/i.test(html) || /text-align\s*:\s*center/i.test(html)) {
      alignment = "center";
    } else if (/align=["']right["']/i.test(html) || /text-align\s*:\s*right/i.test(html)) {
      alignment = "right";
    }

    return { level, text, color, alignment };
  }

  return null;
}

// ============================================================================
// Single Image Pattern
// ============================================================================

interface SingleImage {
  src: string;
  alt?: string;
  width?: string;
  height?: string;
  alignment?: "left" | "center" | "right";
}

function detectSingleImage(html: string): SingleImage | null {
  // Count images - only match if there's exactly one
  const imgCount = (html.match(/<img\s/gi) || []).length;
  if (imgCount !== 1) return null;

  // Extract the image
  const imgMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!imgMatch) return null;

  const src = imgMatch[1];
  const tag = imgMatch[0];

  // Skip tiny images (likely spacers or icons)
  const widthMatch = tag.match(/width=["']?(\d+)/i);
  const heightMatch = tag.match(/height=["']?(\d+)/i);
  const width = widthMatch ? widthMatch[1] : undefined;
  const height = heightMatch ? heightMatch[1] : undefined;

  if (width && parseInt(width, 10) < 50) return null;
  if (height && parseInt(height, 10) < 50) return null;

  // Skip base64 placeholder images
  if (src.startsWith("data:image/gif;base64,R0lGOD")) return null;

  const alt = tag.match(/alt=["']([^"']+)["']/i)?.[1];

  // Check alignment
  let alignment: SingleImage["alignment"];
  if (/align=["']center["']/i.test(html) || /text-align\s*:\s*center/i.test(html) || /<center>/i.test(html)) {
    alignment = "center";
  } else if (/align=["']right["']/i.test(html) || /text-align\s*:\s*right/i.test(html)) {
    alignment = "right";
  } else if (/align=["']left["']/i.test(html) || /float\s*:\s*left/i.test(html)) {
    alignment = "left";
  }

  return { src, alt, width, height, alignment };
}

// ============================================================================
// WA System Widget Pattern (should be removed)
// ============================================================================

type WaSystemWidgetType = "login" | "navigation" | "mobile-panel" | "search" | "logo-header";

interface WaSystemWidget {
  type: WaSystemWidgetType;
  description: string;
}

function detectWaSystemWidget(html: string): WaSystemWidget | null {
  // Login widget
  if (/loginContainer|loginLink|loginPanel/i.test(html)) {
    return { type: "login", description: "WA login widget - use native auth" };
  }

  // Navigation menu (includes menuInner with firstLevel)
  if (/menuBackground|menuHorizontal|WaGadgetNavigation/i.test(html)) {
    return { type: "navigation", description: "WA navigation menu - use native nav" };
  }
  if (/menuInner[^>]*>[\s\S]*?firstLevel/i.test(html)) {
    return { type: "navigation", description: "WA navigation menu - use native nav" };
  }

  // Mobile panel
  if (/mobilePanel|mobilePanelButton/i.test(html)) {
    return { type: "mobile-panel", description: "WA mobile panel - use native mobile menu" };
  }

  // Search widget
  if (/searchBox|searchField|generalSearchBox/i.test(html)) {
    return { type: "search", description: "WA search widget - use native search" };
  }

  // Logo header (site-specific logo that shouldn't migrate)
  if (/<img[^>]*logo/i.test(html) && /headerLogo|siteLogo|WaGadgetLogo/i.test(html)) {
    return { type: "logo-header", description: "WA site logo - configure in site settings" };
  }

  return null;
}

// ============================================================================
// WA Events Widget Pattern
// ============================================================================

interface WaEventsWidget {
  count?: number;
  showCalendar: boolean;
}

function detectWaEventsWidget(html: string): WaEventsWidget | null {
  if (/WaGadgetUpcomingEvents|eventList|upcomingEvents|eventCalendar/i.test(html)) {
    const showCalendar = /calendar|eventCalendar/i.test(html);
    return { showCalendar };
  }
  return null;
}

// ============================================================================
// WA Store Widget Pattern (unsupported)
// ============================================================================

interface WaStoreWidget {
  type: "catalog" | "product" | "cart";
}

function detectWaStoreWidget(html: string): WaStoreWidget | null {
  if (/WaGadgetOnlineStoreCatalog|OnlineStoreCatalog/i.test(html)) {
    return { type: "catalog" };
  }
  if (/WaGadgetOnlineStoreProduct|OnlineStoreProduct/i.test(html)) {
    return { type: "product" };
  }
  if (/WaGadgetOnlineStoreCart|OnlineStoreCart/i.test(html)) {
    return { type: "cart" };
  }
  return null;
}

// ============================================================================
// List Content Pattern
// ============================================================================

interface ListContent {
  type: "ordered" | "unordered";
  items: string[];
}

function detectListContent(html: string): ListContent | null {
  // Skip if this is a navigation menu
  if (/menuInner|firstLevel|navigation/i.test(html)) return null;

  // Check for ul or ol
  const ulMatch = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  const olMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);

  const listHtml = ulMatch?.[1] || olMatch?.[1];
  if (!listHtml) return null;

  const type: ListContent["type"] = olMatch ? "ordered" : "unordered";

  // Extract list items
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(listHtml)) !== null) {
    // Clean the item text
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (text) {
      items.push(text);
    }
  }

  if (items.length === 0) return null;

  return { type, items };
}

// ============================================================================
// Empty Spacer Pattern (should be removed)
// ============================================================================

function detectEmptySpacer(html: string): boolean {
  // Strip all tags and check if there's any real content
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If no text content, it's a spacer
  if (textContent.length === 0) return true;

  // If only contains form hidden fields, it's a spacer
  if (/__VIEWSTATE|__VIEWSTATEGENERATOR|__EVENTVALIDATION/i.test(html)) {
    if (textContent.length < 20) return true;
  }

  return false;
}

// ============================================================================
// Photo Album Pattern (Camera.js gallery)
// ============================================================================

interface PhotoAlbum {
  id: string;
  imageCount: number;
  images: Array<{ src: string; caption?: string }>;
}

function detectPhotoAlbum(html: string): PhotoAlbum | null {
  // Camera.js photo gallery: camera_wrap class
  const cameraMatch = html.match(/class=["'][^"']*camera_wrap[^"']*["'][^>]*id=["']([^"']+)["']/i);
  if (!cameraMatch) return null;

  const id = cameraMatch[1];
  const images: Array<{ src: string; caption?: string }> = [];

  // Extract images from data-src attributes
  const imgRegex = /data-src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.startsWith("data:")) {
      images.push({ src });
    }
  }

  if (images.length === 0) return null;

  return { id, imageCount: images.length, images };
}

// ============================================================================
// Link List Pattern (multiple links in a block)
// ============================================================================

interface LinkList {
  links: Array<{ text: string; href: string }>;
}

function detectLinkList(html: string): LinkList | null {
  // Skip navigation menus
  if (/menuInner|navigation|firstLevel/i.test(html)) return null;

  // Count links
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  const links: Array<{ text: string; href: string }> = [];

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].trim();

    // Skip social media links (handled separately)
    if (/facebook|twitter|instagram|linkedin|youtube|x\.com/i.test(href)) continue;

    if (text && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      links.push({ text, href });
    }
  }

  // Only count as link list if 3+ links
  if (links.length < 3) return null;

  return { links };
}

// ============================================================================
// Main Pattern Analyzer
// ============================================================================

// ============================================================================
// Legacy Styling Pattern
// ============================================================================

interface LegacyStyleResult {
  /** What type of block this should become */
  blockType: "heading" | "text" | "empty";
  /** The clean text content */
  text: string;
  /** Heading level if blockType is heading */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Text alignment */
  alignment?: "left" | "center" | "right";
  /** Original had bold styling */
  wasBold?: boolean;
  /** Original had italic styling */
  wasItalic?: boolean;
}

function detectLegacyStyling(html: string): LegacyStyleResult | null {
  // Check for legacy styling indicators OR gadget content div
  const hasLegacy = /<font/i.test(html) ||
                    /align\s*=\s*["']/i.test(html) ||
                    /<center>/i.test(html) ||
                    /style\s*=\s*["'][^"']*(?:font-size|color|line-height)/i.test(html);

  // Also treat gadgetContentEditableArea, blog content, and title blocks as content that needs processing
  const isGadgetContent = /gadgetContentEditableArea|gadgetStyleBody|blogPostBody|gadgetBlogEditableArea|gadgetStyleTitle|gadgetTitleH[1-6]/i.test(html);

  if (!hasLegacy && !isGadgetContent) return null;

  // Extract clean text first to see if there's actual content
  const text = html
    // Remove script and style tags
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove font tags but keep content
    .replace(/<\/?font[^>]*>/gi, "")
    // Remove center tags
    .replace(/<\/?center>/gi, "")
    // Convert br to newlines (but track if that's ALL there is)
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  // If no actual text content, mark as empty (should be removed)
  if (!text) {
    return { blockType: "empty", text: "" };
  }

  // Extract alignment
  let alignment: "left" | "center" | "right" | undefined;
  if (/align\s*=\s*["']center["']/i.test(html) || /<center>/i.test(html)) {
    alignment = "center";
  } else if (/align\s*=\s*["']right["']/i.test(html)) {
    alignment = "right";
  }

  // Check for bold/italic
  const wasBold = /<strong|<b>/i.test(html);
  const wasItalic = /<em>|<i>/i.test(html);

  // Check for explicit heading tags (h1-h6)
  const headingTagMatch = html.match(/<h([1-6])[^>]*>/i);
  if (headingTagMatch) {
    const level = parseInt(headingTagMatch[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
    return {
      blockType: "heading",
      text,
      headingLevel: level,
      alignment,
      wasBold,
      wasItalic,
    };
  }

  // Extract font size to determine if this should be a heading
  const sizeMatch = html.match(/font-size\s*:\s*(\d+)px/i);
  const fontSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

  // Determine block type based on styling
  // Large text (especially if bold) should become a heading
  if (fontSize >= 24 || (fontSize >= 18 && wasBold)) {
    // Map font size to heading level
    let headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
    if (fontSize >= 36) headingLevel = 1;
    else if (fontSize >= 30) headingLevel = 2;
    else if (fontSize >= 24) headingLevel = 3;
    else if (fontSize >= 20) headingLevel = 4;
    else if (fontSize >= 18) headingLevel = 5;
    else headingLevel = 6;

    return {
      blockType: "heading",
      text,
      headingLevel,
      alignment,
      wasBold,
      wasItalic,
    };
  }

  // Otherwise it's regular text
  return {
    blockType: "text",
    text,
    alignment,
    wasBold,
    wasItalic,
  };
}

/**
 * Analyze HTML and detect common patterns that can be replaced with widgets.
 */
export function analyzeHtmlPatterns(html: string): HtmlPatternMatch[] {
  const matches: HtmlPatternMatch[] = [];

  // Check for legacy styling that can be auto-cleaned
  const legacyStyle = detectLegacyStyling(html);
  if (legacyStyle) {
    // Empty content - should be removed
    if (legacyStyle.blockType === "empty") {
      matches.push({
        pattern: "empty-spacer",
        description: "Empty styled block (can be removed)",
        confidence: 0.99,
        replacement: {
          type: "remove",
          action: "Remove empty block",
          autoApply: true,
          blockData: {},
        },
        extractedData: { isEmpty: true },
        originalHtml: html.substring(0, 300),
      });
      return matches;
    }

    // Large styled text → Heading
    if (legacyStyle.blockType === "heading") {
      matches.push({
        pattern: "simple-heading",
        description: `Text → Heading ${legacyStyle.headingLevel}`,
        confidence: 0.9,
        replacement: {
          type: "simplify",
          widgetType: "heading",
          action: `Convert to H${legacyStyle.headingLevel} heading`,
          autoApply: true,
          blockData: {
            level: legacyStyle.headingLevel,
            text: legacyStyle.text,
            alignment: legacyStyle.alignment,
          },
        },
        extractedData: legacyStyle,
        originalHtml: html.substring(0, 300),
      });
      return matches;
    }

    // Regular styled text → clean Text block
    if (legacyStyle.blockType === "text" && legacyStyle.text.length > 0) {
      matches.push({
        pattern: "simple-text",
        description: "Text block",
        confidence: 0.95,
        replacement: {
          type: "simplify",
          widgetType: "text",
          action: "Convert to clean text block",
          autoApply: true,
          blockData: {
            content: legacyStyle.text,
            alignment: legacyStyle.alignment,
          },
        },
        extractedData: legacyStyle,
        originalHtml: html.substring(0, 300),
      });
      return matches;
    }
  }

  // Check for social links
  const socialLinks = detectSocialLinks(html);
  if (socialLinks.length >= 2) {
    matches.push({
      pattern: "social-links",
      description: `Social media links (${socialLinks.map(l => l.title).join(", ")})`,
      confidence: 0.9,
      replacement: {
        type: "widget",
        widgetType: "social-follow",
        action: "Replace with Social Follow widget",
        autoApply: true,
        blockData: {
          links: socialLinks.map(l => ({
            platform: l.platform,
            url: l.url,
          })),
        },
      },
      extractedData: { links: socialLinks },
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for contact info
  const contactInfo = detectContactInfo(html);
  if (contactInfo) {
    matches.push({
      pattern: "contact-info",
      description: "Contact information block",
      confidence: 0.8,
      replacement: {
        type: "widget",
        widgetType: "contact-info",
        action: "Replace with Contact Info widget",
        autoApply: true,
        blockData: contactInfo,
      },
      extractedData: contactInfo,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for image gallery (3+ images)
  const images = detectImageGallery(html);
  if (images.length >= 3) {
    matches.push({
      pattern: "image-gallery",
      description: `Image gallery (${images.length} images)`,
      confidence: 0.85,
      replacement: {
        type: "widget",
        widgetType: "gallery",
        action: "Replace with Gallery widget",
        autoApply: true,
        blockData: { images },
      },
      extractedData: { images },
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for video embed
  const video = detectVideoEmbed(html);
  if (video) {
    matches.push({
      pattern: "embed-video",
      description: `${video.platform === "youtube" ? "YouTube" : "Vimeo"} video embed`,
      confidence: 0.95,
      replacement: {
        type: "block",
        widgetType: "video",
        action: "Replace with Video block",
        autoApply: true,
        blockData: {
          platform: video.platform,
          url: video.url,
          videoId: video.videoId,
        },
      },
      extractedData: video,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for Google Maps
  if (/maps\.google\.com|google\.com\/maps/i.test(html)) {
    const mapMatch = html.match(/src=["']([^"']*(?:maps\.google|google\.com\/maps)[^"']*)["']/i);
    matches.push({
      pattern: "google-map",
      description: "Google Maps embed",
      confidence: 0.9,
      replacement: {
        type: "widget",
        widgetType: "map",
        action: "Replace with Map widget",
        autoApply: false, // Need to extract address
        blockData: {
          embedUrl: mapMatch?.[1],
        },
      },
      extractedData: { embedUrl: mapMatch?.[1] },
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for CTA buttons (WA stylized buttons)
  const ctaButtons = detectCtaButtons(html);
  if (ctaButtons.length > 0) {
    for (const button of ctaButtons) {
      matches.push({
        pattern: "call-to-action",
        description: `CTA button: "${button.text}"`,
        confidence: 0.95,
        replacement: {
          type: "block",
          widgetType: "cta",
          action: "Replace with CTA button block",
          autoApply: true,
          blockData: {
            text: button.text,
            href: button.href,
            variant: button.variant,
          },
        },
        extractedData: button,
        originalHtml: html.substring(0, 300),
      });
    }
  }

  // Check for content dividers
  const divider = detectContentDivider(html);
  if (divider) {
    matches.push({
      pattern: "content-divider",
      description: "Content divider",
      confidence: 0.95,
      replacement: {
        type: "block",
        widgetType: "divider",
        action: "Replace with Divider block",
        autoApply: true,
        blockData: {
          style: divider.style,
        },
      },
      extractedData: divider,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for accent headings (headings with brand color)
  const accentHeading = detectAccentHeading(html);
  if (accentHeading) {
    matches.push({
      pattern: "accent-heading",
      description: `Heading with brand color (${accentHeading.color})`,
      confidence: 0.9,
      replacement: {
        type: "block",
        widgetType: "heading",
        action: "Convert to heading with accent variant",
        autoApply: true,
        blockData: {
          level: accentHeading.level,
          text: accentHeading.text,
          alignment: accentHeading.alignment,
          variant: "accent", // Will be styled by theme
          originalColor: accentHeading.color, // For theme extraction
        },
      },
      extractedData: accentHeading,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for WA system widgets (should be removed)
  const waSystemWidget = detectWaSystemWidget(html);
  if (waSystemWidget) {
    matches.push({
      pattern: "wa-system-widget",
      description: waSystemWidget.description,
      confidence: 0.99,
      replacement: {
        type: "remove",
        action: `Remove - ${waSystemWidget.description}`,
        autoApply: true,
        blockData: {},
      },
      extractedData: waSystemWidget,
      originalHtml: html.substring(0, 300),
    });
    // Return early - system widgets don't need further analysis
    return matches;
  }

  // Check for WA store widget (unsupported)
  const waStore = detectWaStoreWidget(html);
  if (waStore) {
    matches.push({
      pattern: "wa-store",
      description: `WA Online Store (${waStore.type}) - not supported`,
      confidence: 0.99,
      replacement: {
        type: "remove",
        action: "Cannot migrate - Online store requires WA platform",
        autoApply: false,
      },
      extractedData: waStore,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for WA events widget
  const waEvents = detectWaEventsWidget(html);
  if (waEvents) {
    matches.push({
      pattern: "wa-events",
      description: "WA Upcoming Events widget",
      confidence: 0.95,
      replacement: {
        type: "widget",
        widgetType: "events-list",
        action: "Replace with native Events List widget",
        autoApply: true,
        blockData: {
          showCalendar: waEvents.showCalendar,
        },
      },
      extractedData: waEvents,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for single image (only if no gallery detected)
  if (!matches.some(m => m.pattern === "image-gallery")) {
    const singleImage = detectSingleImage(html);
    if (singleImage) {
      matches.push({
        pattern: "single-image",
        description: "Single image",
        confidence: 0.9,
        replacement: {
          type: "block",
          widgetType: "image",
          action: "Convert to Image block",
          autoApply: true,
          blockData: {
            src: singleImage.src,
            alt: singleImage.alt,
            alignment: singleImage.alignment,
          },
        },
        extractedData: singleImage,
        originalHtml: html.substring(0, 300),
      });
    }
  }

  // Check for list content
  const listContent = detectListContent(html);
  if (listContent) {
    matches.push({
      pattern: "list-content",
      description: `${listContent.type === "ordered" ? "Numbered" : "Bulleted"} list (${listContent.items.length} items)`,
      confidence: 0.9,
      replacement: {
        type: "block",
        widgetType: "list",
        action: "Convert to List block",
        autoApply: true,
        blockData: {
          type: listContent.type,
          items: listContent.items,
        },
      },
      extractedData: listContent,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for photo album (Camera.js gallery)
  const photoAlbum = detectPhotoAlbum(html);
  if (photoAlbum) {
    matches.push({
      pattern: "photo-album",
      description: `Photo album (${photoAlbum.imageCount} images)`,
      confidence: 0.95,
      replacement: {
        type: "widget",
        widgetType: "gallery",
        action: "Convert to Gallery widget",
        autoApply: true,
        blockData: {
          images: photoAlbum.images,
        },
      },
      extractedData: photoAlbum,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for link list
  const linkList = detectLinkList(html);
  if (linkList && !matches.some(m => m.pattern === "social-links")) {
    matches.push({
      pattern: "link-list",
      description: `Link list (${linkList.links.length} links)`,
      confidence: 0.8,
      replacement: {
        type: "block",
        widgetType: "links",
        action: "Convert to Links block",
        autoApply: true,
        blockData: {
          links: linkList.links,
        },
      },
      extractedData: linkList,
      originalHtml: html.substring(0, 300),
    });
  }

  // Check for empty spacer (should be removed)
  if (detectEmptySpacer(html)) {
    matches.push({
      pattern: "empty-spacer",
      description: "Empty content block",
      confidence: 0.99,
      replacement: {
        type: "remove",
        action: "Remove empty spacer",
        autoApply: true,
        blockData: {},
      },
      extractedData: { isEmpty: true },
      originalHtml: html.substring(0, 300),
    });
  }

  // Fallback: if no patterns matched, check for plain paragraph content
  // This catches blog posts and other content without WA styling classes
  if (matches.length === 0) {
    // Extract text content
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // If there's actual text content, treat as simple text block
    if (textContent.length > 10) {
      matches.push({
        pattern: "simple-text",
        description: "Text block (paragraph content)",
        confidence: 0.85,
        replacement: {
          type: "simplify",
          widgetType: "text",
          action: "Convert to text block",
          autoApply: true,
          blockData: {
            content: textContent.substring(0, 500),
          },
        },
        extractedData: { text: textContent },
        originalHtml: html.substring(0, 300),
      });
    }
  }

  return matches;
}

/**
 * Get a human-readable summary of what we found.
 */
export function getPatternSummary(matches: HtmlPatternMatch[]): string {
  if (matches.length === 0) {
    return "No recognizable patterns found";
  }

  const autoFix = matches.filter(m => m.replacement.autoApply);
  const manual = matches.filter(m => !m.replacement.autoApply);

  const parts: string[] = [];

  if (autoFix.length > 0) {
    parts.push(`${autoFix.length} can be auto-converted: ${autoFix.map(m => m.description).join(", ")}`);
  }

  if (manual.length > 0) {
    parts.push(`${manual.length} need review: ${manual.map(m => m.description).join(", ")}`);
  }

  return parts.join(". ");
}
