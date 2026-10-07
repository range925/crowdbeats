# Crowdbeats V2 — Public Discovery Integration Guide
**Document Reference**: `CB-DOC-GUIDE-DISCOVERY-004`  
**Classification**: Developer Guide  
**Last Updated**: 2026-08-28  

---

## 1. Introduction

This guide walks client developers through integrating Crowdbeats Public Discovery across **Flutter Mobile** and **Next.js Web** applications.

---

## 2. Implementing Places Autocomplete Search

### Search Hierarchy Workflow:
1. Provide a text field with the standard placeholder:
   `"Search city, town, state or country"`
2. As the user types (minimum 2 characters), query local curated presets or the Google Places Autocomplete API.
3. Display suggestions with prominent city names and administrative areas (e.g. *Torrance, California*, *San Diego, California*, *London, United Kingdom*).
4. When a suggestion is selected:
   - Set `discoveryLocation` to the selected place.
   - Set `isSearchAreaMode` to `true`.
   - Center map camera on `(latitude, longitude)` at zoom level `14`.
   - Update list query and show the *"Use My Location"* quick button to return to device GPS.

---

## 3. Implementing Non-Blocking Geolocation

### Golden Rule:
> **Never block the user interface when location permission is denied or pending.**

### Mobile Implementation (Flutter):
```dart
// Check permission status on startup
final status = await Permission.location.status;
if (status.isGranted) {
  // Use device GPS
} else {
  // Display non-intrusive value banner: "Find live music near you"
  // Default to San Diego or searched city (e.g. Torrance, CA)
}
```

### Web Implementation (Next.js):
```typescript
if (typeof window !== 'undefined' && 'geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => setDeviceLocation({ ... }),
    () => {
      // Non-blocking fallback to Torrance or default location without alert popups
    },
    { timeout: 5000 }
  );
}
```

---

## 4. Integrating the Tip Auth Gate Workflow

```
[Visitor taps "Tip $20"]
         │
         ▼
[Is user logged in?]
   ├── YES: Open TipConfirmationSheet (Confirm & Pay)
   └── NO:  
        1. Create PendingTipAction payload with creatorId, $20, timestamp
        2. Persist to Riverpod / sessionStorage
        3. Show TipAuthGateModal ("Sign in to tip [Artist]")
        4. On Auth complete: Return to TipConfirmationSheet
        5. User explicitly confirms payment (NO auto-charge)
```
