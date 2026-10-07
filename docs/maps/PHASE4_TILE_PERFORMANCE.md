# Phase 4 — Vector Tile Performance & Security Notes

## Tile Provider: Maptiler Cloud (OSM-based)

| Property | Value |
|---|---|
| **Data source** | OpenStreetMap (ODbL license) |
| **Tile format** | Vector tiles (MVT/Protobuf) |
| **Style format** | MapLibre GL Style Specification 8 |
| **Dark style** | Maptiler `streets-v2-dark` |
| **Light style** | Maptiler `streets-v2` |
| **Free tier** | 100,000 tile requests/month |
| **CDN** | Maptiler global CDN (50+ PoPs) |

---

## Security Model

### API Key Architecture

```
Browser ──GET /api/maps/style──► Next.js (Server)
                                     │
                                     │ SERVER_KEY (never leaves server)
                                     ▼
                                 Maptiler API
                                 (fetches GL style JSON)
                                     │
                                     │ style JSON returned
                                     │ tile URLs rewritten with CLIENT_KEY
                                     ▼
Browser ◄──── style JSON (CLIENT_KEY in tile URLs) ─────
│
│ MapLibre fetches tiles directly from Maptiler CDN
▼
Maptiler CDN ← requests with CLIENT_KEY (domain-restricted)
```

### Key Types

| Key | Env Var | Client Visible | Scope |
|---|---|---|---|
| Server key | `MAPTILER_API_KEY` / `MAP_TILE_API_KEY` | ❌ Never | Full API access |
| Client key | `NEXT_PUBLIC_MAPTILER_CLIENT_KEY` | ✅ Domain-restricted | Tile CDN only |

### Production Hardening (Required before launch)

1. **Create a separate client key** in [Maptiler Dashboard](https://cloud.maptiler.com/account/keys)
2. **Set allowed domains**: `crowdbeats.com`, `*.crowdbeats.com` only
3. **Set `NEXT_PUBLIC_MAPTILER_CLIENT_KEY`** to this domain-restricted key
4. **Keep `MAPTILER_API_KEY`** as the unrestricted server key

---

## Performance Measurements (Development, 2026-09-17)

### Map Load Times (MapLibre + Maptiler vector tiles)

| Metric | Measured | Target |
|---|---|---|
| Style JSON fetch (via proxy) | ~180-350ms | < 500ms ✅ |
| First tile render (WebGL) | ~400-800ms total | < 1000ms ✅ |
| Full viewport tile load | ~600-1200ms | < 2000ms ✅ |
| Map interactive (moveend fires) | ~500-900ms | < 1500ms ✅ |

*Measurements from /dev/map-test. Network: local dev (no CDN). Production CDN will be faster.*

### Google Maps vs MapLibre Comparison (development)

| Metric | Google Maps | MapLibre + Maptiler | Δ |
|---|---|---|---|
| Script bundle size | ~580KB (SDK) | ~420KB (maplibre-gl) | -28% ✅ |
| Style fetch | None (baked-in) | ~180ms (proxy) | +180ms |
| First tile paint | ~350ms | ~400ms | +50ms |
| 60fps panning | Yes | Yes | = |
| WebGL required | No (Canvas 2D fallback) | Yes | ⚠ |
| Offline tiles | No | Possible (PMTiles) | + future |

### API Usage Surfaces

| Surface | Trigger | Tile Requests/Visit | Monthly Estimate |
|---|---|---|---|
| /dev/map-test | Dev only | ~40-80 | Dev only |
| /fan/nearby (Phase 8) | Fan opens map | ~30-60 | TBD per DAU |
| Landing page radar | Auto | 0 (CSS-only) | 0 |
| Creator check-in | Per session | ~10-20 | Low |

**Free tier runway**: 100,000 requests/month ÷ 50 avg/visit = ~2,000 map opens/month before billing.

---

## Tile Proxy (MAP_TILE_PROXY_TILES=true)

### When to enable
- Enterprise clients requiring zero client-side credential exposure
- Internal admin maps
- Compliance environments

### Trade-offs
| | Direct CDN (default) | Tile Proxy |
|---|---|---|
| Key in browser? | CLIENT_KEY (domain-restricted) | Never |
| Tile latency | ~20-80ms (CDN PoP) | +30-80ms (server hop) |
| Server cost | None | ~CPU per tile |
| Caching | Browser + CDN | Server + Browser |

---

## Attribution Compliance

### ODbL Requirements
- ✅ Attribution visible on EVERY map surface
- ✅ "© OpenStreetMap contributors" with link
- ✅ MapLibre `attributionControl` configured (`compact: false`)
- ✅ `CrowdbeatsMapAttribution` component available for non-canvas contexts
- ✅ Attribution NOT removable via CSS (accessible element)

### Maptiler ToS
- ✅ "© MapTiler" attribution with link rendered via MapLibre control
- ✅ Logo not suppressed
