# Crowdbeats V2 — Server-Authoritative Nearby Ranking Model
**Document Reference**: `CB-DOC-NEARBY-RANKING-002`  
**Classification**: Algorithm & Security Model  
**Status**: `RATIFIED`  

---

## 1. Algorithm Overview & Invariants

The `nearbyScore` determines which creators appear in the **Top 5 Nearby** section of the discovery first screen.

### Key Invariants:
1. **Server-Authoritative Calculation**: Clients **cannot** alter, submit, or manipulate their own `nearbyScore`.
2. **Proximity & Live Prioritization**: Genuine geographic proximity and active live stage performance are the dominant factors.
3. **No Pay-to-Win Bias**: Creators cannot buy placement or rank higher solely by raw tip dollars.
4. **Zero Financial Exposure**: Ranking logic does not publicly leak creator revenue or fan spending histories.

---

## 2. Mathematical Scoring Model

The `nearbyScore` is computed as:

$$\text{nearbyScore} = S_{\text{distance}} + S_{\text{live}} + S_{\text{schedule}} + S_{\text{verified}} + S_{\text{quality}}$$

Where:
- **$S_{\text{distance}}$ (Distance Decay, max 500 pts)**:
  $$S_{\text{distance}} = \max\left(0, 500 - 20 \times d_{\text{miles}}\right)$$
  *(Performances within 1 mile receive ~480–500 pts; 10 miles receive ~300 pts; $> 25$ miles receive 0 pts).*
- **$S_{\text{live}}$ (Active Live Performance, 300 pts)**:
  $$S_{\text{live}} = \begin{cases} 300 & \text{if creator is actively performing on a public stage} \\ 0 & \text{otherwise} \end{cases}$$
- **$S_{\text{schedule}}$ (Scheduled Performance Today, 100 pts)**:
  $$S_{\text{schedule}} = \begin{cases} 100 & \text{if performance starts within 4 hours} \\ 0 & \text{otherwise} \end{cases}$$
- **$S_{\text{verified}}$ (Verified Badge, 50 pts)**:
  $$S_{\text{verified}} = \begin{cases} 50 & \text{if creator is Stripe Connect verified} \\ 0 & \text{otherwise} \end{cases}$$
- **$S_{\text{quality}}$ (Profile Completeness & Audio Samples, max 50 pts)**.

---

## 3. Selection & Output

1. Query all eligible candidate creators within the target bounding box (radius $\le 25\text{ miles}$).
2. Filter out suspended, demonetized, or non-discoverable accounts.
3. Rank descending by `nearbyScore`.
4. Return **exactly Top 5** (or fewer if fewer than 5 valid candidates exist).
