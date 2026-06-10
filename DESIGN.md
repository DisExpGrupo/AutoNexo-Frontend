---
brand: "AutoNexo (ATG)"
version: "2.5-hybrid"

# Design Tokens (Data Layer)
colors:
  primary:
    main: "#202D36"        # Deep Navy — app background, nav, structural
    white: "#FFFFFF"       # Text on dark, clarity
  secondary:
    action_teal: "#1B7A5A"     # Primary CTA (save, confirm, create) — calm, positive
    action_crimson: "#800C1F"  # Destructive / high-risk (delete, cancel)
    accent_red: "#b91c1c"      # V2 accent — alerts, badges, emphasis (not primary CTA)
    metal_steel: "#5E7795"     # Industrial modern — icons, secondary elements
    metal_light: "#799AB7"     # Secondary text on dark, digital connection
  wireframe:
    surface: "#D9D9D9"     # Dividers, tertiary lines
    border: "#8E8E8E"      # Auxiliary outlines
    dark_element: "#282828" # Iconography on light backgrounds
  text:
    strong: "#000000"      # Base text on light backgrounds
    muted: "#D9D9D9"       # Tertiary info on dark backgrounds
  surface:
    card: "#1a2630"        # Card/container background
    input: "#0f1920"       # Input field background
    elevated: "#162029"    # Slightly elevated surfaces (sidebar, toolbar)

typography:
  display: "IBM Plex Mono, monospace"    # Headings, labels, buttons, technical text
  body: "Inter, sans-serif"              # Body text, descriptions

  scales:
    h1: { size: "48px", weight: "700", line_height: "56px", letter_spacing: "-0.02em" }
    h2: { size: "32px", weight: "700", line_height: "40px", letter_spacing: "-0.01em" }
    h3: { size: "24px", weight: "600", line_height: "32px" }
    button: { size: "16px", weight: "700" }
    body: { size: "16px", weight: "400", line_height: "24px" }
    label: { size: "14px", weight: "600", line_height: "20px", letter_spacing: "0.01em" }
    caption: { size: "12px", weight: "500", line_height: "16px" }

shapes:
  border_radius: "8px"      # Hybrid: reduced from 16px for a more machined feel
  border_radius_lg: "12px"  # Cards, modals

spacing:
  base: "8px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  container_max: "1280px"
  gutter: "24px"

layout:
  grid: "12-column"
  max_width: "1280px"

---

# UX/UI Strategy & Guidelines

## 1. Visual Identity
AutoNexo is a professional, tech-oriented ecosystem for automotive management. The design must evoke **trust, precision, and modern industrial aesthetics**.

**Dark mode is the default.** The app is used in workshops, garages, and on mobile devices in the field. Light mode is available but secondary.

## 2. Color Logic & Hierarchy
*   **Theme:** Dark mode default. Background is `primary.main` (#202D36), cards use `surface.card` (#1a2630), inputs use `surface.input` (#0f1920).
*   **Contrast Rules:** Use `primary.white` for text on dark backgrounds. Use `metal_light` (#799AB7) for secondary text.
*   **Functional Colors:**
    *   `action_teal` (#1B7A5A) — Primary CTA: save, confirm, create, submit. Calm, positive, mechanical.
    *   `action_crimson` (#800C1F) — Destructive: delete, cancel, end session. High-risk.
    *   `accent_red` (#b91c1c) — Emphasis: alerts, warnings, badges, brand accents. Attention-grabbing but not primary action.
    *   `metal_steel` (#5E7795) and `metal_light` (#799AB7) — Non-text elements (progress bars, icons, data viz) and secondary text on dark backgrounds.

## 3. Typography Hierarchy
*   **IBM Plex Mono** for headings, labels, buttons, and technical text — gives a precision instrument feel.
*   **Inter** for body text and descriptions.
*   Labels are uppercase, small, with letter-spacing for scanability.
*   Headlines use tighter letter-spacing to appear more impactful and "engineered."

## 4. Spacing & Layout
*   **8px base grid** — all spacing is a multiple of 8px for rhythmic structure.
*   **12-column grid** on desktop with 24px gutters.
*   **1280px max-width** container for data-heavy views.
*   **Generous vertical padding** (64px+) between major sections to prevent clutter.

## 5. Elevation & Depth
Hierarchy is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

*   **Level 0 (Surface):** Main background (#202D36).
*   **Level 1 (Card):** #1a2630 with 1px border in rgba(94, 119, 149, 0.15). No shadow.
*   **Level 2 (Interactive):** Subtle 1px border change on hover. No glow effects.
*   **Overlays:** Modals use backdrop blur with semi-transparent overlay to maintain focus.

## 6. Component Behavior
*   **Buttons:**
    *   Primary: Solid Teal (#1B7A5A) with white text. High-contrast, positive.
    *   Secondary: Solid Deep Slate (#1e293b) with white text.
    *   Outline: 1px border of Muted Steel with Steel text. Less critical actions.
    *   Destructive: Solid Crimson (#800C1F) with white text.
*   **Input Fields:** 1px border in neutral gray, 2px Teal border on focus. Labels visible above the field.
*   **Cards:** 1px neutral border, no shadow, 24px internal padding. `headline-md` for titles.
*   **Status Chips:** Small capped-height containers. Teal for positive, Crimson for destructive, Muted Steel for neutral, Accent Red for alerts.
*   **Data Tables:** Zebra-stripe with faint slate tint. Headers are `label` (uppercase) with subtle bottom border.

## 7. Accessibility (WCAG 2.2 AA)
*   Maintain a minimum contrast ratio of 4.5:1 for all text elements.
*   All interactive elements must have a visible focus state (Teal outline or ring).
*   Minimum touch target size: 44x44px for buttons and links.
*   `metal_steel` and `metal_light` must not be used for text on light backgrounds.

## 8. Agent Guardrails
*   Do not use drop shadows unless necessary for layering depth.
*   Ensure all primary navigation elements use `primary.main`.
*   Do not invent new colors — use the defined palette.
*   Border radius is 8px for most components, 12px for cards and modals.
