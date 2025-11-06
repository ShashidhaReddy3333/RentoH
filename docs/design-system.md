# Rento Design System Basics

This document captures initial design system foundations and how to apply them across the app. Centralising these primitives reduces duplication, keeps styles consistent, and simplifies future iteration (for example, enabling theming or brand refreshes in one place).

## 1. Shared tokens

Design tokens live in [`design-system/tokens.ts`](../design-system/tokens.ts) and are wired into Tailwind via [`tailwind.config.ts`](../tailwind.config.ts). Tokens are grouped into:

- **Colors** – reference CSS custom properties exposed in `app/globals.css`. Using `tokens.colors.brand.primary` ensures components reference the same color regardless of implementation (Tailwind class, inline style, etc.).
- **Spacing** – consistent spacing scale (`spacing.xs`, `spacing.section`) used for layout, container padding, and component gutters.
- **Radii** – rounded corner scale (`radii.md`, `radii.threeXl`) aligned with the existing visual language.
- **Typography** – semantic text styles (`typography.fontSize.h1`) and the sans-serif stack.
- **Shadows** – elevation presets used by cards and buttons.

Tailwind now imports these tokens so utilities like `rounded-md` or `shadow-md` stay in sync with the token definitions. Changing a token in one place updates every consumer.

## 2. Reusable component exports

A thin barrel file, [`design-system/components/index.ts`](../design-system/components/index.ts), re-exports primitive components (e.g. `Button`, `Input`, `InputField`). Feature teams can import from `@/design-system/components` instead of deep component paths, signalling that these are shared building blocks. Future primitives (Badge, Card, Tooltip, etc.) can follow the same pattern.

## 3. Usage example

Premium listing CTA before adopting tokens:

```tsx
<button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2B70F8] px-4 py-2 text-white shadow-[0_12px_28px_rgba(43,112,248,0.24)]">
  Message landlord
</button>
```

After refactor:

```tsx
import { Button } from "@/design-system/components";

<Button variant="primary" rightIcon={<EnvelopeIcon className="h-4 w-4" />}>Message landlord</Button>
```

Benefits:

1. **Consistency** – colors, shadow, and focus state follow the design tokens rather than ad-hoc values.
2. **Maintenance** – updating the primary color or corner radius happens once in `tokens.ts`.
3. **Accessibility** – primitives encode focus rings, disabled states, and aria attributes.

## 4. Optional Storybook / documentation

Storybook (or similar) can be introduced as the design system matures. Suggested next steps:

1. Add `@storybook/react` and set up stories for each primitive to document props, states, and accessibility guidelines.
2. Include live playgrounds/examples that demonstrate composing tokens and primitives.
3. Surface guidelines for spacing, typography, and grid usage to help designers/developers stay aligned.

For lightweight documentation today, this markdown serves as a quick reference. You can expand it with component status tables, usage do’s & don’ts, and theming guidance as the system evolves.
