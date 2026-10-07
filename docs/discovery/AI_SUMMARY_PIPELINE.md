# Crowdbeats V2 — AI Profile Summary Generation Pipeline
**Document Reference**: `CB-DOC-AI-PIPELINE-004`  
**Classification**: AI System Architecture & Data Pipeline  
**Status**: `APPROVED FOR IMPLEMENTATION`  

---

## 1. Pipeline Architecture

```mermaid
graph TD
    Trigger[Creator Updates Bio / Onboards] --> Ingest[Extract Approved Public Fields]
    Ingest --> Hash[Compute Source Hash]
    Hash --> GenAI[Gemini 1.5 Flash Prompt (8-18 Words)]
    GenAI --> Validation[Anti-Hallucination & Word Count Check]
    Validation -->|Pass| Moderation[Content Moderation Scanner]
    Validation -->|Fail| Fallback[Apply Deterministic Fallback]
    Moderation -->|Pass| Store[(Store aiCardSummary in Firestore)]
    Moderation -->|Fail| Fallback
    Fallback --> Store
```

---

## 2. Strict Prompt Formulation

```
You are a music critic writing a concise, memorable 8-18 word summary for a live performer on Crowdbeats.

Input data:
- Stage Name: {{stageName}}
- Performer Type: {{type}}
- Genres: {{genres}}
- Public Bio: {{bio}}
- Instruments: {{instruments}}

Rules:
1. Length: Exactly 8 to 18 words.
2. Tone: Human, musical, evocative, concise.
3. ABSOLUTE ZERO HALLUCINATION: Do NOT invent awards, record sales, Grammy nods, touring history, or fake collaborations.
4. Output: Return ONLY the summary sentence. No commentary or quotation marks.
```

---

## 3. Post-Generation Verification Filters

1. **Word Count Validator**: Verifies length is between 8 and 18 words.
2. **Hallucination Blacklist**: Scans for unverified keywords (*Grammy*, *Billboard*, *RIAA*, *Platinum*, *World Tour*, *Signed to*).
3. **Safety Scanner**: Runs against Google Cloud Natural Language Moderation API.
4. **Deterministic Fallback**: If any check fails, immediately applies the safe fallback:
   - Solo: *"Independent musician bringing original live music to the Crowdbeats community."*
   - Band: *"Independent band performing original music and connecting with fans through Crowdbeats."*
