# SentinelQ — System Architecture & Technical Specification

> **Classification:** Technical Architecture Document (v2.4)  
> **Platform:** SentinelQ Autonomous Pre-Settlement Fraud Intelligence & Graph Correlation Platform  
> **Compliance & Data Privacy:** Zero-Unmasked PII, Deterministic Synthesis, Tamper-Evident Hash-Chained Audit

---

## 1. Executive Summary & Core Objective

SentinelQ is an autonomous, inline fraud intelligence and network correlation system designed to intercept illicit transactions **prior to settlement finality**. Operating within strict <100ms inference SLAs, SentinelQ computes real-time composite risk scores from statistical deviation, velocity patterns, and graph topology (circular mule rings, shared device fingerprints, and subnet clustering). 

Blocked or high-risk transfers are routed to the **Fraud Interception Queue**, where case briefs are synthesized from structured evidence and decisions are sealed in a **SHA-256 Hash-Chained Audit Ledger**.

```
                           SENTINELQ INLINE PIPELINE
                           
    Incoming Transaction
             │
             ▼
   [ PII Minimization / SHA-256 Masking ]
             │
             ├─────────────────────────────────────────┐
             ▼                                         ▼
   [ Statistical Anomaly Engine ]            [ Graph Correlation Engine ]
   • Velocity & Amount Deviation              • Circular Multi-Hop Cycles
   • Geo / Impossible Travel                  • Mule Ring Centrality Score
   • Device / IP Risk Factors                 • Entity Resolution Clustering
             │                                         │
             └────────────────────┬────────────────────┘
                                  ▼
                    [ Composite Risk Decision Engine ]
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
          Score < 65: APPROVED          Score ≥ 85: PRE_SETTLEMENT_BLOCKED
                   │                    (65-84: REVIEW)
                   ▼                             │
          Settlement Execution                   ▼
                                     [ Interception Queue ]
                                                 │
                                                 ▼
                                     [ Auto-Generated Fraud Case ]
                                                 │
                                                 ▼
                                     [ Case Brief Synthesis ]
                                                 │
                                                 ▼
                                     [ Cryptographic Audit Ledger ]
                                     (Web Crypto API SHA-256 Hash Chain)
```

---

## 2. Component Subsystems

### 2.1. Transaction Ingestion & PII Minimization Layer
- **Ingestion SLA:** Real-time event ingestion bounded to maintain <100ms processing budgets.
- **PII Tokenization & Masking:** Raw account numbers, user identifiers, and IP addresses are masked at the boundary using deterministic prefix-suffix preservation (e.g. `usr_882a...` -> `us****2a`).
- **PII Hash Isolation:** Sensitive attributes (`maskedUserId`, `deviceFingerprint`) are hashed using SHA-256 to create cryptographic commitment tags (`piiHash`) without storing raw identifiers in audit logs.

### 2.2. Statistical Anomaly Engine (`src/utils/risk.ts`)
- Evaluates individual transaction parameters against statistical baselines:
  - **Amount Deviation:** Log-normal ratio calculation against 30-day account baseline.
  - **Velocity Anomaly:** Microsecond burst frequency detection.
  - **Fingerprint & IP Risk:** Cross-referenced against risk subnets and anonymous proxies.

### 2.3. Network Correlation Engine (`src/utils/graphAnalysis.ts`)
- **Graph Topology:** Analyzes directed payment graphs represented as adjacency matrices and node clusters.
- **Circular Mule Ring Detection:** Detects directed cycles ($A \rightarrow B \rightarrow C \rightarrow A$) within a configurable hop depth (3–6 nodes) and time window.
- **Centrality & Hub Scoring:** Evaluates eigenvector and degree centrality to isolate coordinating mule controllers versus peripheral intermediary accounts.
- **Clustering:** Groups entities sharing hardware device fingerprints (`deviceFingerprint`) or subnets.

### 2.4. Pre-Settlement Interception Handler (`src/pages/Interceptions.tsx`)
- Executes inline policy enforcement:
  - `APPROVED` (Score 0–64): Proceeds to clearing without interruption.
  - `REVIEW` (Score 65–84): Queued for analyst inspection; holds settlement window.
  - `PRE_SETTLEMENT_BLOCKED` (Score 85–100): Intercepts transaction in-flight, preventing fund disbursement.

### 2.5. AI-Assisted Case Brief Synthesizer (`src/services/caseBriefService.ts`)
- Deterministic, evidence-grounded synthesis service that aggregates structured telemetry into concise forensic case briefs.
- **Output Structure:**
  1. *Executive Summary*: Factual account of the interception and detected mechanisms.
  2. *Risk Assessment*: Mathematical risk score driver breakdown.
  3. *Network Pattern*: Directed cycle pathing, node counts, and shared hardware signatures.
  4. *Chronological Timeline*: Microsecond sequence of events from initiation to block.
  5. *Recommended Action*: Regulatory-compliant action items (e.g., SAR filing, FIU escalation, account freeze).
- **Design Rule:** No unstructured LLM hallucination risk; all statements map directly to structured graph and transaction telemetry.

### 2.6. Cryptographic Audit Ledger (`src/services/ledgerService.ts`)
- Browser-native, tamper-evident hash-chained registry using standard **Web Crypto API SHA-256**.
- **Record Structure:**
  $$\text{LedgerHash}_i = \text{SHA-256}\left( \text{JSON}(\text{Payload}_i) \parallel \text{LedgerHash}_{i-1} \right)$$
- **Genesis Block:** $\text{LedgerHash}_0 = 0^{64}$.
- **Integrity Verification:** On-demand full chain traversal verifying every hash link and payload integrity in $O(N)$ time.

---

## 3. Frontend Architecture

- **UI Framework:** React 19 + TypeScript (strict mode, zero `any`, zero unused variables).
- **Styling Architecture:** Tailwind CSS v4 with dark enterprise slate palette (`#0F172A`, `#1E293B`, `#334155`), high contrast operational indicators, and zero distracting animations.
- **State Management:** Zustand single-source-of-truth store (`src/store/useStore.ts`) with bounded telemetry buffers (1,000 transactions, 60 telemetry points) to ensure stable 60fps rendering without memory leaks.
- **Visualizations:**
  - `Recharts` for high-density 24-hour anomaly trend lines.
  - `react-force-graph-2d` for interactive force-directed entity relationship network graphs with lazy canvas rendering.
- **Export Engine (`src/services/exportService.ts`):**
  - **Forensic PDF Reports:** Print-friendly HTML renderer with `@media print` vector CSS that automatically invokes the browser PDF engine.
  - **Ledger CSV:** RFC 4180 compliant CSV generator with field quoting, delimiter escaping, and PII masking.

---

## 4. Production Target Architecture (Future Scale)

```
                       PRODUCTION BACKEND SCALING TARGET
                       
 [ API Gateway / Ingress ]  <─── mTLS / TLS 1.3 ───>  Payment Switches / Gateways
             │
             ▼ (Zero-Copy Serialization)
   [ Apache Pulsar / Kafka ]
             │
    ┌────────┴─────────────────────────────────┐
    ▼                                          ▼
[ Real-Time Scoring Workers (Rust) ]   [ Graph DB (Neo4j / Memgraph) ]
 • Stat Engine (ONNX Runtime C++)       • Continuous Cycle Detection
 • Latency SLA: <15ms p99               • Subgraph Centrality Cache
    │                                          │
    └──────────────────┬───────────────────────┘
                       ▼
         [ Decision Service (Go / Rust) ]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
[ Redis Cluster ]            [ Ledger Engine (HSM / KMS Sealed) ]
 • Active Session Cache       • PostgreSQL Hash-Chained Partitioning
 • Interception Hold Queue    • CloudHSM Digital Signatures
```

1. **Ingestion & Streaming:** Distributed Apache Pulsar / Kafka clusters processing >50,000 TPS.
2. **Inference Workers:** Rust or C++ microservices running compiled ONNX models with SIMD vectorization.
3. **Graph Processing:** Memgraph / Neo4j cluster running incremental directed cycle detection.
4. **Hardware-Sealed Ledger:** Write-once hash-chained partitions backed by AWS CloudHSM / HashiCorp Vault for non-repudiation.

---

## 5. Security & Regulatory Compliance

- **Zero Unmasked PII:** Compliant with GDPR, DPDP Act (India), and PCI-DSS minimization standards.
- **Immutability Assurance:** Hash chaining ensures any retrospective ledger modification causes immediate validation failure.
- **Auditing:** Every operator action (`AUTO_BLOCK`, `CONFIRM_BLOCK_SAR`, `WHITELIST_FALSE_POSITIVE`, `ASSIGN_CASE`) is cryptographically sealed in the audit registry.
