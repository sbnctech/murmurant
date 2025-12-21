# SECTIONS MIGRATION INVENTORY

Copyright (c) Santa Barbara Newcomers Club

Goal: eliminate the legacy term Stripe by migrating to Section terminology.

## Remaining references (generated):

### 1) Imports from @/components/stripes

```
src/app/events/page.tsx:14:import { HeroStripe } from "@/components/stripes";
src/app/events/EventsDiscovery.tsx:14:import { ContentStripe } from "@/components/stripes";
src/app/my/page.tsx:16:import { Stripe } from "@/components/stripes";
src/app/gift/page.tsx:13:import { HeroStripe, ContentStripe } from "@/components/stripes";
src/app/my/profile/page.tsx:28:import { Stripe } from "@/components/stripes";
src/app/my/payment-methods/page.tsx:21:import { Stripe } from "@/components/stripes";
```

### 2) Direct mentions of Stripe/HeroStripe/ContentStripe

```
src/app/events/page.tsx:14:import { HeroStripe } from "@/components/stripes";
src/app/events/page.tsx:109:      <HeroStripe
src/lib/payments/index.ts:24: * In production, this will return the real payment provider (Stripe, etc.)
src/lib/payments/types.ts:18:  /** The external provider reference (e.g., Stripe PI ID) */
src/app/events/EventsDiscovery.tsx:14:import { ContentStripe } from "@/components/stripes";
src/app/events/EventsDiscovery.tsx:146:    <ContentStripe testId="events-discovery" padding="lg">
src/app/events/EventsDiscovery.tsx:596:    </ContentStripe>
src/components/sections/index.ts:5:export { HeroStripe as HeroSection, ContentStripe as ContentSection } from "../stripes";
src/app/gift/page.tsx:13:import { HeroStripe, ContentStripe } from "@/components/stripes";
src/app/gift/page.tsx:55:      <HeroStripe
src/app/gift/page.tsx:63:      <ContentStripe
src/app/gift/page.tsx:200:      </ContentStripe>
src/components/sections/Section.tsx:2: * Section - layout-only wrapper (formerly "Stripe")
src/components/stripes/Stripe.tsx:4: * Stripe was a legacy name for a layout wrapper. "Section" matches intent:
src/components/stripes/Stripe.tsx:16:export function Stripe(props: StripeProps) {
src/components/stripes/Stripe.tsx:20:export default Stripe;
src/components/stripes/index.ts:7:export { default as Stripe } from "./Stripe";
src/components/stripes/index.ts:8:export type { StripeProps } from "./Stripe";
src/components/stripes/index.ts:10:export { default as HeroStripe } from "./HeroStripe";
src/components/stripes/index.ts:11:export { default as ContentStripe } from "./ContentStripe";
src/components/stripes/TwoColumnStripe.tsx:11:import Stripe, { StripeProps } from "./Stripe";
src/components/stripes/TwoColumnStripe.tsx:49:    <Stripe {...stripeProps}>
src/components/stripes/TwoColumnStripe.tsx:100:    </Stripe>
src/components/stripes/HeroStripe.tsx:2: * HeroStripe - Marketing hero section
src/components/stripes/HeroStripe.tsx:11:import Stripe from "./Stripe";
src/components/stripes/HeroStripe.tsx:30:export default function HeroStripe({
src/components/stripes/HeroStripe.tsx:40:    <Stripe background={background} padding="xl" testId={testId}>
src/components/stripes/HeroStripe.tsx:104:    </Stripe>
src/components/stripes/ContentStripe.tsx:2: * ContentStripe - General content section with optional title
src/components/stripes/ContentStripe.tsx:11:import Stripe, { StripeProps } from "./Stripe";
src/components/stripes/ContentStripe.tsx:24:export default function ContentStripe({
src/components/stripes/ContentStripe.tsx:32:    <Stripe {...stripeProps}>
src/components/stripes/ContentStripe.tsx:70:    </Stripe>
src/app/my/page.tsx:16:import { Stripe } from "@/components/stripes";
src/app/my/page.tsx:139:      <Stripe padding="md" testId="my-sbnc-header">
src/app/my/page.tsx:182:      </Stripe>
src/app/my/payment-methods/page.tsx:21:import { Stripe } from "@/components/stripes";
src/app/my/payment-methods/page.tsx:157:        <Stripe padding="md">
src/app/my/payment-methods/page.tsx:161:        </Stripe>
src/app/my/payment-methods/page.tsx:171:        <Stripe padding="md">
src/app/my/payment-methods/page.tsx:196:        </Stripe>
src/app/my/payment-methods/page.tsx:211:      <Stripe padding="md" testId="payment-methods-header">
src/app/my/payment-methods/page.tsx:250:      </Stripe>
src/app/my/payment-methods/page.tsx:254:        <Stripe padding="md" testId="ach-promo-banner">
src/app/my/payment-methods/page.tsx:314:        </Stripe>
src/app/my/payment-methods/page.tsx:318:      <Stripe padding="md" background="muted">
src/app/my/payment-methods/page.tsx:736:      </Stripe>
src/app/my/profile/page.tsx:28:import { Stripe } from "@/components/stripes";
src/app/my/profile/page.tsx:232:        <Stripe padding="md" testId="profile-header">
src/app/my/profile/page.tsx:256:        </Stripe>
src/app/my/profile/page.tsx:257:        <Stripe padding="md" background="muted">
src/app/my/profile/page.tsx:327:        </Stripe>
src/app/my/profile/page.tsx:337:        <Stripe padding="md">
src/app/my/profile/page.tsx:360:        </Stripe>
src/app/my/profile/page.tsx:373:      <Stripe padding="md" testId="profile-header">
src/app/my/profile/page.tsx:488:      </Stripe>
src/app/my/profile/page.tsx:491:      <Stripe padding="md" background="muted">
src/app/my/profile/page.tsx:942:      </Stripe>
```
