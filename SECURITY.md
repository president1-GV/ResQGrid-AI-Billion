# RESQGRID AI — SECURITY & ZERO-TRUST ARCHITECTURE

## 1. Security Architecture & Threat Model

ResQGrid AI is built on an enterprise Zero-Trust security foundation. All operations—including disaster zone telemetry ingestion, geospatial route calculation, machine learning demand forecasting, and Google OR-Tools mathematical optimization—are validated, authenticated, and audited.

```
OPERATIONAL OFFICER / CLIENT
              ↓
  [HTTPS & Security Headers]
  (X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy)
              ↓
  [HMAC-SHA256 Bearer Token Authentication & Session Verification]
              ↓
  [PBKDF2 Password Hashing (100,000 Iterations + Unique Salt)]
              ↓
  [Role-Based Access Control (RBAC) & Object Authorization]
              ↓
  [PII Redaction Engine (Phones, Emails, National IDs Scrubbed)]
              ↓
  [Constrained Optimization Layer (Google OR-Tools MIP Hard Constraints)]
              ↓
  [Tamper-Evident Audit Logging (StateStore Log Trail)]
```

---

## 2. Authentication & Credential Management

- **Algorithm**: PBKDF2 with SHA-256 and 100,000 hashing iterations using cryptographically random 16-byte salts (`secrets.token_hex(16)`).
- **Session Tokens**: Cryptographically signed HMAC-SHA256 Bearer tokens with base64-encoded payloads, expiration timestamps, and secret-key verification.
- **Pre-Configured Command Officer Roles**:
  - `INCIDENT_COMMANDER` (`IC-01`, `Col. Arvind Sharma`): Full operational command, allocation approvals, override capabilities.
  - `LOGISTICS_CHIEF` (`LC-04`, `Maj. Priya Sen`): Warehouse and vehicle fleet logistics, allocation adjustments.
  - `FIELD_RESPONDER` (`FD-12`, `Sub-Insp. Rahul Das`): Field situation reports, route inspection, dispatch tracking.
  - `GOVERNANCE_AUDITOR` (`AUD-09`, `Dr. Sunita Roy`): Independent compliance, audit log inspection, analytics exports.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Operation | Incident Commander | Logistics Chief | Field Responder | Governance Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Approve Allocation** | **YES** | NO | NO | NO |
| **Override Dispatch Leg** | **YES** | **YES** | NO | NO |
| **Submit Field Reports** | **YES** | NO | **YES** | NO |
| **Manage Warehouses** | **YES** | **YES** | NO | NO |
| **View Route Maps** | **YES** | **YES** | **YES** | **YES** |
| **Inspect Audit Logs** | **YES** | NO | NO | **YES** |
| **Retrain Models** | **YES** | NO | NO | NO |

---

## 4. Privacy & PII Redaction

All incident descriptions and field intelligence reports are processed through `AuthService.redact_pii` before state storage or ML feature extraction:
- **Phone Numbers**: Scrubbed and replaced with `[REDACTED PHONE]`
- **Email Addresses**: Scrubbed and replaced with `[REDACTED EMAIL]`
- **National Identity Numbers**: Scrubbed and replaced with `[REDACTED NATIONAL ID]`

---

## 5. Constrained Optimization Hard Security Guarantees

The optimization engine utilizes Google OR-Tools MIP (SCIP solver) with mathematically enforced hard constraints:
1. **Warehouse Inventory Conservation**: Total units dispatched from any depot cannot exceed on-hand inventory under any scenario.
2. **Zone Demand Upper Bound**: No disaster zone can be allocated more commodity units than its verified requirement.
3. **Non-Negativity**: All flow variables strictly enforce non-negative integer values.

---

## 6. HTTP Enterprise Security Headers

Every HTTP response from the FastAPI application includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
