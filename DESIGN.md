---
brand: "AutoNexo (ATG)"

# Design Tokens (Data Layer)
colors:
  primary:
    main: "#202D36"        # Deep Navy / Tech Blue
    white: "#FFFFFF"       # Surface / Clarity
  secondary:
    action_crimson: "#800C1F"  # Destructive / high-risk actions (delete, cancel)
    accent_dark_red: "#3C0007" # Mechanical energy / Alerts
    action_teal: "#1B7A5A"     # Positive CTAs (save, confirm, create)
    metal_steel: "#5E7795"     # Industrial modern
    metal_light: "#799AB7"     # Digital connection
  wireframe:
    surface: "#D9D9D9"     # Containers / Dividers
    border: "#8E8E8E"      # Auxiliary outlines
    dark_element: "#282828" # Iconography
  text:
    strong: "#000000"      # Base text on light backgrounds
    muted: "#D9D9D9"       # Tertiary info or text on dark backgrounds

typography:
  display: "IBM Plex Mono, monospace"    # Headings, labels, buttons, technical text
  body: "Inter, sans-serif"              # Body text, descriptions

  scales:
    h1: { size: "70px", weight: "700", line_height: "84px" }
    h2: { size: "40px", weight: "500", line_height: "52px" }
    h3: { size: "25px", weight: "500", line_height: "34px" }
    button: { size: "16px", weight: "700" }
    body: { size: "16px", weight: "400" }
    caption: { size: "14px", weight: "700" }

shapes:
  border_radius: "16px" # Corner smoothing for all UI components

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
---

# UX/UI Strategy & Guidelines

## 1. Visual Identity
AutoNexo is a professional, tech-oriented ecosystem for automotive management. The design must evoke **trust, precision, and modern industrial aesthetics**.

## 2. Color Logic & Hierarchy
*   **Theme:** Dark mode is the default. Background is `primary.main`, cards use `#1a2630`, inputs use `#0f1920`.
*   **Contrast Rules:** Use `primary.white` for text on dark backgrounds. Use `text.muted` (or `metal_light`) for secondary text.
*   **Functional Colors:**
    *   `action_crimson` is reserved for destructive or high-risk actions (delete, cancel, end session).
    *   `action_teal` is for positive CTAs (save, confirm, create). Passes AA on dark backgrounds.
    *   `metal_steel` and `metal_light` are for non-text elements (progress bars, icons, data viz) and secondary text on dark backgrounds.

## 3. Component Behavior
*   **Containers & Modals:** Apply a global `border_radius` of **16px** to maintain visual consistency with the branding samples.
*   **Typography Hierarchy:** `IBM Plex Mono` for headings, labels, buttons, and technical text — gives a precision instrument feel. `Inter` for body text and descriptions. Labels are uppercase, small, with letter-spacing.
*   **Spacing:** Maintain a clean, professional layout with generous white space to avoid visual clutter in a workshop environment.

## 4. Accessibility (WCAG 2.2 AA)
*   Maintain a minimum contrast ratio of 4.5:1 for all text elements.
*   All interactive elements must have a visible focus state (use `primary.main` outline or ring).
*   Minimum touch target size: 44x44px for buttons and links.
*   `metal_steel` and `metal_light` must not be used for text on light backgrounds.

## 5. Agent Guardrails
*   Do not use drop shadows unless necessary for layering depth.
*   Ensure all primary navigation elements use `primary.main`.
*   Do not invent new colors — use the defined palette.
