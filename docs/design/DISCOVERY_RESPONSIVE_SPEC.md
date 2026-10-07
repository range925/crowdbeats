# Crowdbeats V2 — Discovery Responsive & Accessibility Specification
**Document Reference**: `CB-DESIGN-RESPONSIVE-005`  
**Classification**: Responsive Layout & WCAG 2.1 AA Specification  
**Status**: `APPROVED FOR IMPLEMENTATION`  

---

## 1. Responsive Layout Hierarchy

The location-first discovery hierarchy (`Search -> Compact Map -> Top 5 Nearby -> Top 3 Popular`) is identical across mobile and desktop, adapting layout structure without fracturing the user mental model:

### Mobile Layout (< 768px):
```
[ Sticky Header: Wordmark + Live Pulse ]
[ Location Search: 100% width, 52px height ]
[ Compact Google Map: 220px height, full-width rounded card ]
[ Nearby Section: Header + "See All" ➔ 5 Vertical Compact Cards ]
[ Popular Section: Header + "See All" ➔ 3 Vertical Ranked Cards ]
[ Bottom Floating Navigation Bar ]
```

### Desktop Layout ($\ge 768px$):
```
[ Top Navbar: Logo, Location Indicator, Auth CTA ]
[ Centered Hero Container: max-width 1024px ]
  ├── [ Large Location Search Bar: 640px max-width ]
  ├── [ Compact Map Preview: 260px height, 100% width ]
  ├── [ 2-Column Discovery Section ]:
  │     ├── [ Left Column (60%) ]: Top 5 Nearby Cards
  │     └── [ Right Column (40%) ]: Top 3 Popular Cards + Top Venues Card
```

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

- **Touch Targets**: Minimum $44 \times 44\text{ pt}$ touch targets on all mobile buttons and interactive map pins.
- **Color Contrast**: 
  - Primary text (`#FFFFFF`) on `#0B0C10` and `#151722`: Contrast ratio $> 14:1$ (exceeds AAA).
  - Secondary text (`#94A3B8`) on `#151722`: Contrast ratio $> 5.2:1$ (exceeds AA).
- **Keyboard Navigation**: Full `Tab`, `Shift+Tab`, and `Enter`/`Space` accessibility for search input, map expansion, and card tip actions.
- **Screen Reader Support**: Semantic HTML headers (`<h1>`, `<h2>`) and ARIA labels on live badges (`aria-label="Live stage active at The Main Stage"`).
