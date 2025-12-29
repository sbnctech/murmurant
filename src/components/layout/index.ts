/**
 * Layout Components
 *
 * Token-based layout components for consistent UI across Murmurant.
 */

export { default as PageHeader } from "./PageHeader";
export { default as SectionCard } from "./SectionCard";
export { default as DataTableFrame } from "./DataTableFrame";
export { default as FormRow } from "./FormRow";
export { default as MemberLayout } from "./MemberLayout";
export {
  default as AuthorizedNav,
  ADMIN_NAV_ITEMS,
  OFFICER_NAV_ITEMS,
  type NavItem,
} from "./AuthorizedNav";

// Branded layout components
export { BrandedLayout, type BrandedLayoutProps, type BrandConfig } from "./BrandedLayout";
export { BrandedHeader, type BrandedHeaderProps, type NavLink } from "./BrandedHeader";
export { BrandedFooter, type BrandedFooterProps, type SocialLink, type FooterLink } from "./BrandedFooter";
