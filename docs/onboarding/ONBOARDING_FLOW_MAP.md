# Crowdbeats V2 — Complete Universal Onboarding Flow Map

**Authoritative Design Authority:** Google Stitch 5326179813018056505  

---

## 1. Flow Diagram

```mermaid
flowchart TD
    Step0["Step 0: Welcome & Value Statement\n(Actions: Create Account / Sign In / Guest Explore)"] --> Step1["Step 1: Choose Sign-in Method\n(Google / Apple / Email)"]
    Step1 --> Step2["Step 2: Legal Eligibility & Agreements\n(Age 18+ / Terms / Privacy / Optional Marketing)"]
    Step2 --> Step3["Step 3: Persona Selection\n(Fan / Solo Musician / Band / Sponsor)"]
    Step3 --> Step4["Step 4: Public Identity\n(Display Name / Photo / Handle Reservation)"]
    
    Step4 --> Branch{Primary Persona}
    
    Branch -->|Fan| Fan1["Fan 1: Genre Discovery\n(Tappable Chips / Skip)"]
    Fan1 --> Fan2["Fan 2: Location Search\n(Manual City Search / Explicit Location Action)"]
    Fan2 --> Review["Review & Completion Screen\n(Editable Summary Cards)"]
    
    Branch -->|Solo Musician| Solo1["Solo 1: Performer Identity\n(Stage Name / Genres / City)"]
    Solo1 --> Solo2["Solo 2: Public Story & Bio\n(Bio character counter / Social links)"]
    Solo2 --> Solo3["Solo 3: First Goal\n(Build Profile / Receive Support / Campaign)"]
    Solo3 --> Review
    
    Branch -->|Band| Band1["Band 1: Band Identity\n(Name / Genres / Base City)"]
    Band1 --> Band2["Band 2: Role & Attestation\n(Founder / Manager / Member)"]
    Band2 --> Band3["Band 3: Member Invites\n(Optional Revocable Invites)"]
    Band3 --> Review
    
    Branch -->|Sponsor| Spons1["Sponsor 1: Organization Identity\n(Org Name / Sponsor Type / Role)"]
    Spons1 --> Spons2["Sponsor 2: Target Reach & Genres\n(Target Audiences & Geographies)"]
    Spons2 --> Spons3["Sponsor 3: First Objective\n(Match Pools / Campaign Sponsorship)"]
    Spons3 --> Review
    
    Review --> Complete["Atomic Profile Finalization & Audit\n(Custom claims set / Draft cleared)"]
    Complete --> Success["Personalized First-Run Success Destination\n(/fan, /artist, /band, /sponsor)"]
```

---

## 2. Resumable State Lifecycle

The state machine persists progress to `/onboardingDrafts/{uid}` on every forward transition:
$$\text{notStarted} \longrightarrow \text{accountCreated} \longrightarrow \text{legalAccepted} \longrightarrow \text{personaSelected} \longrightarrow \text{profileInProgress} \longrightarrow \text{review} \longrightarrow \text{completed}$$
