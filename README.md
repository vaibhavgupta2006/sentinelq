# SentinelQ — Autonomous Pre-Settlement Fraud Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![React](https://img.shields.io/badge/React-19-cyan.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary-slate.svg)]()

> **SECURITY & DEMONSTRATION NOTICE**: SentinelQ uses synthetic telemetry and deterministic local simulation models for hackathon evaluation and compliance demonstration. Raw customer PII is never stored or decrypted. Refer to [SECURITY.md](SECURITY.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for enterprise production specifications.

---

## 1. Overview

**SentinelQ** is a mission-critical pre-settlement fraud defense console designed for Tier-1 banks, payment aggregators, and fintech infrastructure. Operating with strict **<100ms latency budgets**, SentinelQ correlates statistical transaction anomalies with deep graph topology (detecting multi-hop circular mule rings and synthetic identity clusters) to intercept fraudulent transfers **in flight before settlement clearing**.

---

## 2. Core Capabilities

### 🛡️ Real-Time Fraud Operations Dashboard (`/dashboard`)
- Live, streaming transaction telemetry with color-coded risk stratification.
- Bounded 24-hour volume, suspicious velocity, and interception trend charts.
- Selected transaction slide-over drawer with instant investigation routing and one-click Forensic Report (PDF) generation.

### 🕸️ Graph Intelligence & Entity Resolution (`/intelligence`)
- Force-directed 2D transaction network graph with interactive zoom, pan, and node inspection.
- Automated cycle detection identifying circular funding loops ($A \rightarrow B \rightarrow C \rightarrow A$).
- Degree and eigenvector centrality scoring to expose mule ring coordinator accounts.

### ⚡ Pre-Settlement Interception Queue (`/interceptions`)
- Inline hold queue for transactions exceeding critical risk thresholds ($\ge 85$).
- Rapid triage workflow: **"Confirm Block & Issue SAR"** or **"Whitelist Pattern / False Positive"**.
- Bounded multi-dimensional filter bar (Status, Risk Level, Time Window) and RFC 4180 CSV export.

### 📋 AI-Assisted Case Brief Synthesizer (`/cases`, `/cases/:caseId`)
- Deterministic, evidence-grounded case brief generation synthesizing:
  - Executive Summary
  - Risk Assessment Drivers
  - Network Pattern & Entity Cluster Subgraphs
  - Chronological Event Timeline
  - Regulatory Action Recommendations (SAR, FIU, KYC freeze)
- Zero LLM hallucination risk: all statements map directly to verified telemetry.
- One-click **Forensic Investigation Report (PDF)** generation formatted for print and legal archiving.

### 🔒 Cryptographic Audit Ledger (`/ledger`)
- Tamper-evident, hash-chained audit registry using the browser's **Web Crypto API SHA-256**.
- Every decision, rule block, and analyst action is sealed with $\text{LedgerHash}_i = \text{SHA-256}(\text{Payload}_i \parallel \text{LedgerHash}_{i-1})$.
- Live on-demand **"Verify Ledger Integrity"** validation engine.
- Complete RFC 4180 CSV export with PII hash isolation.

### 🎬 Dedicated Hackathon Demo Mode
- Accessible via the **"Demo Mode"** toggle in the top header.
- Deterministic ~18-second simulated scenario: **"Coordinated Mule Account Ring"**:
  1. Ingestion of normal background telemetry.
  2. High-value cross-border transfer detection (`₹4,50,000` to `usr_demo_mule_1`).
  3. Network correlation identifying 4-node circular layering pattern (Composite risk spikes to 94).
  4. Pre-settlement automated block execution (`PRE_SETTLEMENT_BLOCKED`).
  5. Automated case creation & brief synthesis.
  6. Cryptographic sealing of the audit record into the hash chain.
- Includes **`[Start Investigation]`** and **`[Reset Demo]`** controls that cleanly restore the system state without corruption.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Installation
```bash
npm install
```

### 2. Development Server
Start the local development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to explore SentinelQ.

### 3. Production Build
Verify TypeScript compilation and bundle production assets:
```bash
npm run build
```

### 4. Static Code Quality / Linting
Run the fast static analyzer:
```bash
npx oxlint
```

---

## 4. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript 5.x, Vite 8.x |
| **Styling** | Tailwind CSS v4 (Enterprise Slate Theme) |
| **State Management** | Zustand (Single store with bounded buffers) |
| **Routing** | React Router v7 |
| **Visualizations** | Recharts (Telemetry), React Force Graph 2D (Network Topology) |
| **Cryptography** | Web Crypto API (`crypto.subtle.digest` SHA-256) |
| **Icons** | Lucide React |

---

## 5. Repository Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — Comprehensive technical architecture, graph algorithms, and production scaling target.
- [SECURITY.md](SECURITY.md) — Enterprise security specification, PII minimization, CSP, and production requirements.

---

## 6. License & Disclaimer

Copyright © 2026 SentinelQ Systems. All rights reserved.  
*Demonstration application containing synthetic financial and network data.*
