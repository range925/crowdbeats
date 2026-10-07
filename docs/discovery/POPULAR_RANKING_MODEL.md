# Crowdbeats V2 — Server-Authoritative Popular Ranking Model
**Document Reference**: `CB-DOC-POPULAR-RANKING-003`  
**Classification**: Algorithm & Security Model  
**Status**: `RATIFIED`  

---

## 1. Algorithm Overview & Invariants

The `popularityScore` determines which creators appear in the **Top 3 Popular** section of the discovery first screen.

### Key Invariants:
1. **Multi-Signal Engagement**: Combines unique views, follow velocity, repeat discovery, and live performance history.
2. **Financial Privacy Guardrail**: Raw tip totals, fan payment histories, and individual contribution sizes are strictly excluded from public payloads.
3. **Cascading Geographic Scope**: If a searched city (e.g. *Torrance, CA*) has fewer than 3 popular creators, the query gracefully widens to the regional metro (*South Bay* $\rightarrow$ *Los Angeles Region* $\rightarrow$ *Crowdbeats Global Trending*) and communicates scope transparently.

---

## 2. Mathematical Scoring Model

$$\text{popularityScore} = \min\left(1000, \, 0.35 \cdot V_{\text{unique}} + 0.25 \cdot F_{\text{follows}} + 0.20 \cdot L_{\text{sessions}} + 0.10 \cdot Q_{\text{profile}} + 0.10 \cdot B_{\text{tips}}\right)$$

Where:
- $V_{\text{unique}}$: Unique listener views in last 30 days (bounded, $\log_{10}$-scaled).
- $F_{\text{follows}}$: Active follower count and 7-day follow velocity.
- $L_{\text{sessions}}$: Number of completed verified live stage sessions.
- $Q_{\text{profile}}$: Profile completeness (high-res photo, bio, audio sampler, verified links).
- $B_{\text{tips}}$: Bounded aggregate transaction frequency count (number of unique supporters, not dollar volume).

---

## 3. Scope Cascading Hierarchy

```
[Level 1: Local City (e.g. Torrance, CA)]
      │
      ▼ (if < 3 creators)
[Level 2: Sub-Regional Metro (e.g. South Bay / Greater LA)]
      │
      ▼ (if < 3 creators)
[Level 3: Global Platform Trending]
```

*The UI transparently reports: "Popular in Torrance" or "Popular in Los Angeles Region".*
