# Paper Board Labs — UI Design System

> **Instructions for Claude Code.** This document describes the Paper Board Labs visual
> identity and how to apply it to our existing **React + TypeScript + TailwindCSS** site.
> The goal is to align the site's UI with the social/brand kit we designed. Follow the
> tokens and patterns below. **Do not redesign features or change functionality** — only
> restyle the presentation layer to match this system. When in doubt, prefer restraint:
> lots of whitespace, thin lines, one accent.

---

## 1. Brand in one paragraph

Paper Board Labs (PBL) builds **local-first, ethical, accessible** digital tools and teaches
people how to use them. The visual language is **calm, honest, a little playful**: hand-drawn
line-art, a warm off-white "paper" ground with a subtle dot grid, near-black ink, and a single
soft-yellow accent. The mascot is a friendly line-art CRT monitor with a smiley face — used
**sparingly**, as an accent, never as decoration on every screen.

**Keep:** minimal, editorial, generous spacing, thin strokes.
**Avoid:** heavy shadows, saturated colors, multiple accents, gradients-as-decoration, emoji,
rounded-corner cards with left-border accent stripes, and other generic "SaaS" tropes.

---

## 2. Color tokens

Add these to `tailwind.config.{js,ts}` under `theme.extend.colors`. Names are intentionally
brand-specific so they read clearly in markup.

```ts
// tailwind.config.ts
extend: {
  colors: {
    paper:   '#F4F1EA', // avorio — primary light background ("paper")
    ink:     '#1F1F1D', // near-black — text, lines, dark background
    yellow:  '#FCE285', // brand accent (fills, dots, badges) — NEVER as text on light
    'yellow-deep': '#F4CE5A', // yellow for small text/numerals that need contrast on paper
    line:    '#DAD6C9', // hairline borders, dividers on paper
    muted:   '#6E6B62', // secondary text on paper
    'muted-2': '#8A867B', // tertiary text / metadata labels
    'paper-2': '#ECE8DD', // slightly darker paper — image placeholders, insets
    desk:    '#E7E4DB', // page canvas behind "cards" (optional)
  },
}
```

**Dark theme (optional, for parity):**

```ts
'ink-bg':   '#1F1F1D', // dark background
'ink-dot':  '#34342F', // dot-grid dots on dark
'paper-on-ink': '#F4F1EA', // text on dark
'muted-on-ink': '#A7A399', // secondary text on dark
```

### Usage rules
- **Text** is always `ink` (light bg) or `paper-on-ink` (dark bg). Secondary = `muted`.
- **Yellow is a shape color, not a text color.** Use it for badge fills, the wordmark dot,
  small accents, filled buttons. If you truly need yellow text, use `yellow-deep` and only
  for tiny mono numerals/labels.
- **One accent per screen.** Don't spread yellow around.

---

## 3. Typography

Three families, each with a clear job:

| Role | Family | Notes |
|---|---|---|
| **Display / headings / wordmark** | `CODE` | Thin geometric, **ALL-CAPS only**, wide letter-spacing (~0.02–0.14em). Our brand font — files provided. |
| **Body / paragraphs** | `Space Grotesk` | Readable, geometric grotesk. Google Fonts. |
| **Labels / metadata / CTAs / numerals** | `Space Mono` | Uppercase, letter-spacing ~2–3px. Google Fonts. |

### Font setup

1. Copy the provided font files into the project (e.g. `public/fonts/`), renamed **without spaces**:
   `CODE-Light.otf` (weight 300), `CODE-Bold.otf` (weight 700).

2. Global CSS (e.g. `src/index.css`):

```css
@font-face {
  font-family: 'CODE';
  src: url('/fonts/CODE-Light.otf') format('opentype');
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'CODE';
  src: url('/fonts/CODE-Bold.otf') format('opentype');
  font-weight: 700;
  font-display: swap;
}
```

3. Load Google fonts (in `index.html` `<head>` or via CSS `@import`):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

4. Tailwind config:

```ts
extend: {
  fontFamily: {
    display: ['CODE', 'sans-serif'],       // font-display
    sans:    ['Space Grotesk', 'system-ui', 'sans-serif'], // default body
    mono:    ['Space Mono', 'ui-monospace', 'monospace'],  // font-mono
  },
}
```

### Type rules
- Headings: `font-display font-light uppercase tracking-tight leading-[0.92]`. Big and confident.
  Because CODE is caps-only, **always render heading text uppercase** (CSS `uppercase` or literal caps).
- Body: `font-sans`, comfortable size (`text-base`/`text-lg`), `leading-relaxed`, color `text-ink`
  or `text-muted` for secondary.
- Labels / eyebrows / CTAs: `font-mono uppercase tracking-widest text-muted-2` (small).
- Never use CODE for long body copy or small UI text — it's display-only.

---

## 4. Surfaces, shape & spacing

- **Backgrounds:** `paper` (`#F4F1EA`) with a subtle dot grid. Implement the dot grid as a
  utility, not an image, so it scales:

  ```css
  /* src/index.css */
  .bg-dotgrid {
    background-color: #F4F1EA;
    background-image: radial-gradient(circle, #D8D3C4 1.4px, transparent 1.6px);
    background-size: 32px 32px;
  }
  .bg-dotgrid-dark {
    background-color: #1F1F1D;
    background-image: radial-gradient(circle, #34342F 1.5px, transparent 1.7px);
    background-size: 32px 32px;
  }
  ```

- **Borders:** hairline `1px solid line` (`border border-line`). Section dividers can be a
  `2px` `ink` top rule under a mono eyebrow label.
- **Radius:** two modes only —
  - **Pills** for buttons / badges / tags: `rounded-full`.
  - **Sharp (0px)** for cards, panels, image frames. We generally **do not** use medium
    rounded corners. Keep it flat and editorial.
- **Shadows:** avoid on in-page UI. If elevation is truly needed (modals), use a soft, low
  shadow like `shadow-[0_40px_80px_-30px_rgba(0,0,0,0.15)]` — never default Tailwind `shadow-md`.
- **Spacing:** be generous. Prefer `gap`-based fl*ex/grid layouts over margins. Section padding
  should feel roomy (e.g. `py-24`/`px-8+`).

---

## 5. Core components (Tailwind recipes)

Restyle existing components to match these. Keep your component APIs; change classes only.

### Wordmark
The "O" in "BOARD" is a solid yellow disc. Implement as text with an inline disc:

```tsx
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-light uppercase tracking-[0.14em] text-ink ${className}`}>
      PAPER B
      <span className="inline-block rounded-full bg-yellow align-[-0.02em]"
            style={{ width: '0.62em', height: '0.62em' }} />
      ARD LABS
    </span>
  );
}
```

### Button — primary (filled ink)
```tsx
<button className="font-mono uppercase tracking-wider text-sm rounded-full
                   bg-ink text-paper px-7 py-3.5 transition-opacity hover:opacity-80">
  Explore tools →
</button>
```

### Button — accent (filled yellow)
```tsx
<button className="font-mono uppercase tracking-wider text-sm rounded-full
                   bg-yellow text-ink px-7 py-3.5 transition-opacity hover:opacity-80">
  Register free
</button>
```

### Button — secondary (outline)
```tsx
<button className="font-mono uppercase tracking-wider text-sm rounded-full
                   border-2 border-ink text-ink px-7 py-3.5 hover:bg-ink hover:text-paper transition-colors">
  Read the manifesto
</button>
```

### Badge / tag
```tsx
// dark
<span className="font-mono uppercase tracking-widest text-xs rounded-full bg-ink text-paper px-4 py-1.5">New</span>
// yellow
<span className="font-mono uppercase tracking-widest text-xs rounded-full bg-yellow text-ink px-4 py-1.5">Local-first</span>
```

### Eyebrow label + section rule
```tsx
<div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
  01 — Selected work
</div>
```

### Card / panel
```tsx
<div className="bg-paper border border-line p-10">
  {/* flat, sharp corners, hairline border, no shadow */}
</div>
```

### Image placeholder (before real assets exist)
Diagonal-stripe fill with a mono caption — matches the kit:
```tsx
<div className="flex items-center justify-center border border-line bg-paper-2
                [background-image:repeating-linear-gradient(45deg,#E2DDCF_0_2px,transparent_2px_15px)]">
  <span className="font-mono text-sm text-muted-2">project shot · 4:3</span>
</div>
```

### Mascot usage
- Asset: transparent line-art PNG (the smiley CRT monitor). Keep it **small and occasional** —
  hero corner, empty states, 404, loading. Not on every card.
- On **dark** backgrounds the line-art disappears (strokes are near-black). Place it on a
  `paper` circle: `<div className="rounded-full bg-paper p-6"><img .../></div>`.

---

## 6. Voice & copy (if touching text)
Warm, plain, honest, lightly playful. Short sentences. Examples of tone:
*"Own your data."* · *"The internet was a promise. Let's keep it."* · *"No cloud, no lock-in."*
Handles: `@paperboardlabs` / `paperboardlabs.com`. Mono for handles and metadata.

---

## 7. What to do (task checklist for Claude Code)

Work incrementally and keep the diff reviewable:

1. **Tokens first.** Add the color + fontFamily extensions to `tailwind.config`, the
   `@font-face` blocks and `.bg-dotgrid` utilities to global CSS, and load the Google fonts.
   Copy `CODE-Light.otf` / `CODE-Bold.otf` into `public/fonts/`.
2. **Set defaults.** Make `paper` the app background and `Space Grotesk` the default body font;
   set base text color to `ink`.
3. **Typography pass.** Convert headings to `font-display font-light uppercase tracking-tight`;
   convert eyebrows/labels/CTAs to `font-mono uppercase tracking-widest`.
4. **Components pass.** Restyle buttons, badges, cards, inputs, nav to the recipes above
   (pills for actions, sharp flat cards, hairline `line` borders, no default shadows).
5. **Accent discipline.** Replace existing accent/brand colors with `yellow` **as fills only**;
   ensure no yellow text on light. One accent per view.
6. **Mascot + wordmark.** Add the `Wordmark` component to the header/footer; place the mascot
   sparingly (hero corner / empty states / 404).
7. **Dark parity (optional).** Where a dark surface exists, use `ink-bg` + `.bg-dotgrid-dark`
   + `paper-on-ink` text, yellow accent unchanged.

### Guardrails
- Don't change routing, state, data, or component APIs — **styling only**.
- Don't introduce new colors, fonts, gradients, emoji, or heavy shadows.
- Don't round card corners or add left-border accent stripes.
- Keep accessibility: text contrast ≥ 4.5:1 (ink on paper is fine; never yellow text on paper).
- Prefer editing Tailwind classes over adding new CSS; add CSS only for `@font-face`,
  dot-grid utilities, and keyframes.

---

## 8. Quick reference

```
paper   #F4F1EA   ink     #1F1F1D   yellow  #FCE285   yellow-deep #F4CE5A
line    #DAD6C9   muted   #6E6B62   muted-2 #8A867B   paper-2     #ECE8DD

Display  CODE (Light 300 / Bold 700), ALL-CAPS, tracking wide
Body     Space Grotesk
Labels   Space Mono, uppercase, tracking-widest

Actions  rounded-full (pills)      Cards  sharp 0px, border-line, no shadow
Accent   yellow = fills only, one per screen
Mascot   small & occasional; on dark → put on a paper circle
```
