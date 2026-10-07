# Crowdbeats V2 — AI-Generated Profile Card Summary Specification
**Document Reference**: `CB-DESIGN-AI-SUMMARY-003`  
**Classification**: AI Feature & Data Governance Specification  
**Status**: `APPROVED FOR IMPLEMENTATION`  

---

## 1. Product Objective

Every Nearby and Popular profile card on the discovery first screen is capable of showing a short, memorable, human, and musical **AI-Generated Summary** (target length: **8–18 words**).

### Golden Rule:
> **The summary must be based ONLY on approved public profile data and must NEVER hallucinate unverified accolades or leak private information.**

---

## 2. Examples of Approved Summaries

| Creator | Type | Example Summary (8–18 words) |
| :--- | :--- | :--- |
| **Jake Rios** | Solo Artist | *"Indie-folk storyteller blending warm acoustic guitar with late-night California energy."* (11 words) |
| **The Sunsets** | Band | *"Four-piece rock band mixing country grit, blues swagger and crowd-driven live sets."* (12 words) |
| **Maya Lin** | Solo Artist | *"Electronic ambient producer performing live synthesizer arrangements and dynamic vocal loops."* (11 words) |
| **Luna Causey** | Solo Artist | *"Soulful R&B vocals, stripped-back acoustics and a stage presence built for intimate rooms."* (13 words) |

---

## 3. Data Ingestion & Privacy Boundary

### ✅ Allowed Public Sources:
- Public artist / band stage name.
- Creator public bio.
- Musical genres and subgenres (e.g. *Indie Rock*, *Acoustic Folk*).
- Instruments played (e.g. *Acoustic Guitar*, *Synthesizers*, *Upright Bass*).
- Musical influences & performance style description.
- Public city & public venue context.

### 🚫 Strictly Forbidden Sources:
- Private chat messages / emails / phone numbers.
- Private residential address or real-time GPS history.
- Stripe account IDs / customer IDs / payout balances / bank info.
- Identity & KYC verification documents.
- Internal risk scores / moderation strike notes / private analytics.

---

## 4. Anti-Hallucination & Moderation Protection

### Invariants:
1. **No Invented Accolades**: The AI must **never** invent Grammy awards, Spotify stream counts, Billboard chart positions, record label signings, celebrity endorsements, or festival headliner claims unless verified in approved profile data.
2. **Safe Deterministic Fallback**: If bio data is insufficient or empty, use standard platform fallbacks:
   - **Solo**: *"Independent musician bringing original live music to the Crowdbeats community."*
   - **Band**: *"Independent band performing original music and connecting with fans through Crowdbeats."*
3. **Content Moderation**: All generated summaries pass through standard moderation scanners (blocking hate speech, harassment, sexual language, and defamation).

---

## 5. Storage & Generation Lifecycle

Summaries are generated asynchronously on profile creation or significant profile updates and cached in Firestore:

```typescript
export interface AiSummaryMetadata {
  readonly aiCardSummary: string;
  readonly aiSummaryVersion: number;
  readonly aiSummaryGeneratedAt: IsoTimestamp;
  readonly aiSummarySourceHash: string;
  readonly aiSummaryStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REVIEW_REQUIRED' | 'REJECTED' | 'FALLBACK';
}
```

*Cards simply display the summary text cleanly without annoying "AI-generated" badges.*
