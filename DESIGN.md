# Design Brief — MedAlert AI

## Aesthetic
Clinical precision with human warmth. Minimal decoration, maximum clarity and trust. Dark slate foundation with vibrant emerald green, warm amber, and clinical red for status hierarchy.

## Palette

| Token | Light OKLCH | Dark OKLCH | Usage |
|-------|----------|----------|-------|
| Background | 0.98 0 0 | 0.11 0 0 | Page background, deep slate |
| Foreground | 0.15 0 0 | 0.96 0 0 | Text, primary content |
| Card | 0.99 0 0 | 0.14 0 0 | Medicine cards, elevated surfaces |
| Primary | 0.50 0.12 142 | 0.72 0.21 152 | Teal/blue accents, interactive elements |
| Accent | 0.68 0.18 142 | 0.72 0.21 152 | Highlights, active states |
| Success | Emerald 0.65 0.23 152 | 0.72 0.21 152 | Safe medicines badge |
| Warning | Amber 0.72 0.18 78 | 0.78 0.22 78 | Near expiry badge |
| Destructive | Red 0.58 0.23 27 | 0.68 0.21 27 | Expired badge, critical alerts |
| Muted | 0.92 0 0 | 0.17 0 0 | Secondary text, disabled states |
| Border | 0.88 0 0 | 0.22 0 0 | Card borders, dividers |

## Typography
Display: General Sans (bold, modern). Body: General Sans (refined, legible). Mono: Geist Mono (code, data).

## Shape Language
Border radius 0.5rem (clinical modern). Tight spacing grid: 8px/16px/24px/32px. Shadows only for elevation, no blur/glow.

## Structural Zones

| Zone | Background | Styling | Purpose |
|------|-----------|---------|---------|
| Sidebar | 0.13 0 0 dark | Card border (left accent stripe in teal) | Navigation, persistent |
| Header | 0.14 0 0 dark | Subtle top border-b in muted | User info, notifications, logout |
| Main Content | 0.11 0 0 dark | Grid layout with cards | Dashboard, scanner, medicine list |
| Card Surface | 0.14 0 0 dark | Slight border in muted, no shadow | Medicine summary, data |
| Alert Banner | Destructive/Warning | Elevated with icon left | Expiry warnings, urgent states |

## Components
Summary cards (4-up grid): large number, label, status color. Medicine table: name, expiry, batch, status badge. Action buttons: secondary outline for non-critical, primary solid for scanner/save.

## Motion
Smooth transitions (0.3s cubic-bezier) on hover/active. No entrance animations; focus clarity over surprise. Opacity fade for visibility changes.

## Constraints
No gradients, no blur/glow shadows, no decorative patterns. One accent color per action. High contrast for OCR scanning UI and status badges (AA+). Sidebar must remain visible on desktop (no collapse).

## Signature Detail
Medicine status badges use vibrant colors (emerald, amber, red) set against dark cards for immediate visual scanning. Sidebar left edge accent stripe in teal reinforces precision and trust.
