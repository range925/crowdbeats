# Crowdbeats V2 — Custom Server API Security & Anti-SSRF Model

**Document Status:** Permanent Security Specification  
**Code Reference:** `packages/contracts/src/integrations/customApiSecurity.ts`  

---

## 1. Zero-Trust Security Invariants for Custom Outbound APIs

1. **Protocol:** Mandatory HTTPS with valid TLS certificate.
2. **Anti-SSRF Protection:**
   - Blocks loopback (`localhost`, `127.0.0.1`, `::1`).
   - Blocks cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
   - Blocks private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
3. **Execution Limits:** Maximum timeout of 10,000ms, rate limits capped at 600 requests/minute, maximum response payload of 1MB.
4. **Approval Gates:** Custom integrations require Security Review, Privacy Review, and Legal Review approval before production enablement.
