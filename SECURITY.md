# SentinelQ Security & Reliability Architecture

This document outlines the security controls, data handling, and reliability mechanisms implemented in SentinelQ.

## ⚠️ Important Notice
**This is a simulated fintech application designed for demonstration purposes (e.g., hackathons).** It uses synthetic data and client-side processing to demonstrate complex AI-driven fraud intelligence pipelines.

**DEMO/SIMULATION LOGIC vs PRODUCTION ARCHITECTURE**
The current codebase runs entirely in the browser using a mock real-time ingestion pipeline (`useTransactionStream.ts`) and client-side Zustand state. 

In a production environment, SentinelQ MUST be split into a strict client-server architecture with the security controls detailed below.

---

## 1. Data Privacy & PII Minimization

### Current Simulation Controls
- **Data Masking**: All user identifiers are masked at the point of ingestion (e.g., `usr_98**a7`). Raw identifiers are never exposed in the UI.
- **Synthetic Data**: No real customer data, real IP addresses, or real device fingerprints are used.
- **Cryptographic Hashing**: The Audit Ledger hashes PII strings using the native Web Crypto API (`SHA-256`) before writing records.

### Production Requirements
- PII must be encrypted at rest and in transit (AES-256-GCM / TLS 1.3).
- Strict tokenization must be employed for sensitive fields (e.g., PAN, SSN) before they hit the SentinelQ pipeline.
- Data minimization policies should enforce ephemeral storage of raw signals.

## 2. Authentication & Authorization

### Production Requirements
- **Authentication**: OIDC / SAML integration with the organization's identity provider (e.g., Okta, Entra ID).
- **RBAC**: Strict Role-Based Access Control enforcing least privilege:
  - `FraudAnalyst`: Read-only access to cases, can whitelist or confirm blocks.
  - `PlatformAdmin`: Can modify system parameters, view audit trails, and manage integrations.
- **API Authorization**: All endpoints must enforce scoped JWT validation.
- **WebSocket Security**: WSS only, requiring ticket-based auth or scoped tokens for stream subscription.

## 3. Application Security Controls

### Frontend Hardening (Implemented)
- **Sanitization**: Dynamic content is safely interpolated by React, preventing XSS.
- **Input Validation**: Filters and search queries are properly sanitized before evaluating against the state.
- **No Dangerous DOM**: Zero usage of `dangerouslySetInnerHTML`.
- **Defensive Types**: Strict TypeScript models ensure malformed mock data cannot crash the render tree safely handled via Error Boundaries.

### Production Network & Browser Controls (Required)
- **Content Security Policy (CSP)**: Strict CSP headers disabling inline scripts and restricting remote sources.
- **HTTPS**: Enforce HSTS globally.
- **Secure Cookies**: `HttpOnly`, `Secure`, and `SameSite=Strict` for all session data.
- **CSRF Protection**: Stateful session protection via Anti-CSRF tokens for all mutating API requests.
- **Rate Limiting**: Strict L7 rate limiting on API endpoints to prevent exhaustion and scraping.

## 4. Cryptographic Audit Ledger

### Current Implementation
SentinelQ implements a **Hash-Chained Audit Registry**.
- Every decision is recorded sequentially.
- The `ledgerHash` is derived from `SHA256(RecordPayload + PreviousLedgerHash)`.
- It is NOT a blockchain; it is a tamper-evident, centralized audit log.

### Production Enhancements
- Transition to a Write-Once-Read-Many (WORM) storage backend (e.g., AWS QLDB or S3 Object Lock).
- Implement hardware-backed key signing (HSM or KMS) to sign each block.
- Secure secret management via AWS Secrets Manager or HashiCorp Vault. **Never hardcode or expose API keys.**

## 5. Reliability & Error Handling

### Implemented Controls
- **React Error Boundaries**: Catch rendering failures globally and per-component without crashing the entire SPA.
- **State Containers**: Graceful `LoadingState`, `EmptyState`, and `ErrorState` components applied to complex modules (like the Intelligence Graph).
- **Route-level Handling**: Catch-all routes handling invalid URLs securely.
- **Throttling**: The UI prevents notification spam via throttle timing controls on simulated events.

## 6. Dependency & Supply Chain Security
- **Production builds** execute `tsc -b && vite build` strictly enforcing type safety.
- **Requirement**: Implement automated dependency scanning (e.g., Dependabot, Snyk) to monitor CVEs in all upstream packages.
