# heardOS Brand Kit

All assets live in `/public/brand/`. The active logo source is the tightly
cropped transparent PNG exported from the supplied artwork.

---

## Colors

| Role | Hex | Usage |
|------|-----|-------|
| Primary / Orange | `#FF6B00` | Buttons, accent, "OS" in wordmark |
| Dark Background | `#0A0F17` | App background, icon backgrounds |
| Near Black | `#050505` | PWA theme color |
| Foreground | `#FFFFFF` | Primary text on dark |
| Light Surface | `#F5F4F0` | Icon light-bg variant |

---

## Typography

**Wordmark:** supplied artwork  
**"heard"** in white, **"OS"** in `#FF6B00` orange

---

## Logo Files

### Master
| File | Description |
|------|-------------|
| `logo.png` | Cropped transparent horizontal logo |
| `header-logo.png` | Same cropped transparent logo for headers |
| `logo.svg` | SVG compatibility wrapper that embeds `logo.png` |

### Icon Variants
| File | Background | Use Case |
|------|------------|----------|
| `app-icon-192.png` | Transparent | PWA manifest, Android |
| `app-icon-512.png` | Transparent | PWA manifest, maskable |
| `apple-touch-icon.png` | Transparent | iOS home screen |
| `favicon.png` | Transparent | Browser tab favicon |
| `icon-*.svg` | Transparent | SVG compatibility wrappers that embed `app-icon-512.png` |

### Wordmarks
| File | Description |
|------|-------------|
| `wordmark-dark.svg` | SVG compatibility wrapper that embeds `logo.png` |
| `wordmark-light.svg` | SVG compatibility wrapper that embeds `logo.png` |
| `wordmark-stacked.svg` | SVG compatibility wrapper that embeds `logo.png` |

### Legacy PNG Icons (kept for compatibility)
| File | Size |
|------|------|
| `heardos-app-icon-192.png` | 192×192 |
| `heardos-app-icon-512.png` | 512×512 |

---

## Usage in React

```jsx
// App header / nav
<img src="/brand/header-logo.png" alt="heardOS" height={36} />

// Splash / onboarding hero
<img src="/brand/logo.png" alt="heardOS" width={300} />

// Logo mark only (e.g. avatar, compact nav)
<img src="/brand/app-icon-512.png" alt="heardOS" width={40} height={40} />

// App icon preview
<img src="/brand/app-icon-512.png" alt="heardOS icon" width={64} height={64} />
```

---

## Usage in CSS

```css
/* Favicon is set in index.html automatically */
/* For background use: */
.logo-bg {
  background-image: url('/brand/app-icon-512.png');
  background-size: contain;
  background-repeat: no-repeat;
}
```
