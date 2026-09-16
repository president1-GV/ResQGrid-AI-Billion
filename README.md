# RESQGRID AI — Dynamic Disaster Resource Allocation & Re-Optimization Platform

> **OPTIMIZE RELIEF. SAVE TIME. REACH FASTER.**  
> *From Disaster Signals to Explainable Decisions.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Google OR-Tools](https://img.shields.io/badge/Optimization-Google%20OR--Tools%20(MIP)-4285F4?logo=google&logoColor=white)](https://developers.google.com/optimization)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![OpenStreetMap](https://img.shields.io/badge/GIS-Leaflet%20%2B%20CartoDB-7EBC6F?logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org)
[![Tests](https://img.shields.io/badge/Test%20Suite-Passing%20(100%25)-brightgreen)](#testing)

---

## 1. Project Overview & Positioning

During major disasters (floods, earthquakes, cyclones), disaster management authorities face acute information overload combined with critical resource scarcity:
- Demand is highly uneven and dynamic.
- Roads, bridges, and causeways suddenly flood or collapse.
- Regional hospital capacities saturate without warning.
- Warehouse inventories deplete rapidly.
- Multiple unverified emergency dispatches arrive concurrently.

**RESQGRID** is an explainable, constraint-aware disaster resource allocation and continuous re-optimization platform. It answers the fundamental operational question:
> **WHAT** resource should go **WHERE**, **WHEN**, from **WHICH DEPOT**, and through **WHICH ROUTE** under hard physical constraints.

### What ResQGrid is NOT:
- ❌ Not just a disaster alert or news feed.
- ❌ Not an ungrounded LLM chatbot pretending to calculate math.
- ❌ Not a generic GIS map viewer without optimization logic.
- ❌ Not an unconstrained simulator that generates physically impossible dispatches.

---

## 2. Core End-to-End System Workflow

```
REAL / PUBLIC DISASTER SIGNALS (IMD, Open-Meteo, Field Dispatches)
                              ↓
              DATA FUSION & TELEMETRY ADAPTERS
                              ↓
         DEMAND ESTIMATION (Sphere Standards Formulaic Engine)
                              ↓
     EXPLAINABLE PRIORITY ENGINE (Multi-Factor Scoring: 0-100)
                              ↓
 MATHEMATICAL OPTIMIZER (Google OR-Tools Mixed-Integer Programming)
                              ↓
 HARD CONSTRAINTS (Warehouse Caps, Fleet Payloads, Road Blocks, Equity Bounds)
                              ↓
              ROUTING ENGINE (Dijkstra Road Graph & Detours)
                              ↓
            RESOURCE GAP & DEFICIT ANALYSIS (Zone Shortages)
                              ↓
       HUMAN-IN-THE-LOOP (Officer Review: Approve / Modify / Reject)
                              ↓
               DYNAMIC FIELD FEEDBACK & DISRUPTION EVENT
                              ↓
          RE-OPTIMIZATION ENGINE (Automated & Delta Diffing)
```

---

## 3. Mathematical Optimization Model (Google OR-Tools)

The core decision engine leverages **Google OR-Tools (SCIP / MIP Solver)**.

### Sets & Indices
- $w \in W$: Set of relief warehouses / strategic depots.
- $z \in Z$: Set of impacted disaster zones / municipal sectors.
- $r \in R$: Set of critical commodities (`water`, `food`, `medical_kits`, `ambulances`, `medical_teams`, `shelter_kits`).

### Decision Variables
- $x_{w, z, r} \ge 0$: Quantity of commodity $r$ dispatched from warehouse $w$ to zone $z$. (Integer for ambulances & medical teams, continuous/float for bulk rations).
- $u_{z, r} \ge 0$: Unmet shortage of commodity $r$ in zone $z$.

### Configurable Multi-Objective Function
$$\min \sum_{z \in Z} \sum_{r \in R} \Big( w_{\text{unmet}} \cdot P_z \cdot \omega_r \cdot u_{z, r} \Big) + \sum_{w \in W} \sum_{z \in Z} \sum_{r \in R} \Big( w_{\text{time}} \cdot T_{w, z} + w_{\text{dist}} \cdot D_{w, z} \Big) x_{w, z, r}$$

Where:
- $P_z$: Explainable Priority Score of zone $z$ (0 to 100).
- $\omega_r$: Normalized priority weight of commodity $r$ (e.g. Medical = 1.0, Water = 0.85, Food = 0.70).
- $T_{w, z}$: Shortest feasible transit time (minutes) calculated over non-blocked roads.
- $D_{w, z}$: Road network distance (km).
- $w_{\text{unmet}}, w_{\text{time}}, w_{\text{dist}}, w_{\text{equity}}$: Configurable weights adjustable via the Command Center UI.

### Hard Constraints
1. **Depot Inventory Bounds**:
   $$\sum_{z \in Z} x_{w, z, r} \le \text{Inventory}_{w, r} \quad \forall w \in W, \forall r \in R$$
2. **Conservation of Demand & Shortage Accounting**:
   $$\sum_{w \in W} x_{w, z, r} + u_{z, r} = \text{Demand}_{z, r} \quad \forall z \in Z, \forall r \in R$$
3. **Road Accessibility & Inaccessibility**:
   $$x_{w, z, r} = 0 \quad \text{if all paths between } w \text{ and } z \text{ are blocked}$$
4. **Humanitarian Equity Minimum Guarantee**:
   For any high-vulnerability critical zone where $P_z \ge 80.0$:
   $$\sum_{w \in W} x_{w, z, r} \ge 0.40 \cdot \text{Demand}_{z, r} \quad \text{for } r \in \{\text{medical\_kits}, \text{water}, \text{ambulances}\}$$
   *Prevents remote or impoverished settlements from being starved of aid in favor of closer, less critical areas.*

---

## 4. Empirical Baseline vs. ResQGrid Benchmarking

Every optimization run supports a side-by-side comparison against the **Standard Operational Baseline (Greedy Nearest-First Dispatch)**:

| Evaluation Metric | Baseline (Greedy Dispatch) | ResQGrid (OR-Tools MIP) | Measured Improvement | Operational Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Average Response Time** | 30.6 min | **15.4 min** | **+49.7% Faster** | Balances depot workloads and prevents transit bottlenecks. |
| **Humanitarian Equity Gap** | High Disparity (24.2) | **Low Variance (8.4)** | **+65.2% Equity Lift** | Guarantees minimum quotas for remote and vulnerable slum clusters. |
| **Fleet Travel Distance** | 235.3 km | **200.2 km** | **14.9% Distance Saved** | Eliminates criss-crossing and redundant supply journeys. |
| **Solver Latency** | Manual heuristic | **11.8 ms** | Real-time | Solves global system constraints in under 20 milliseconds. |

---

## 5. Technology Stack

### Backend
- **Python 3.10+ / 3.14**: High-performance asynchronous core.
- **FastAPI**: REST API with OpenAPI/Swagger autogenerated documentation.
- **Google OR-Tools (`pywraplp`)**: Mixed Integer Programming & Simplex solvers.
- **Dijkstra Graph Routing**: Network path calculation with dynamic road closure avoidance.
- **Empirical NLP & Regex Extractor**: Parses unstructured text field reports into structured demand.

### Frontend
- **React 19 & TypeScript**: Type-safe responsive UI.
- **Vite**: Sub-second Hot Module Replacement (HMR) and optimized rollup bundle.
- **Tailwind CSS v4**: Tactical emergency-management dark theme.
- **Leaflet & CartoDB Dark Matter**: Interactive GIS map with live GeoJSON layers.
- **Recharts**: Analytical visualizations for supply, demand, and solver trends.
- **Lucide React**: Operational iconography.

---

## 6. Project Structure

```
ResQGrid-AI-Billion/
├── backend/
│   ├── main.py                     # FastAPI server & route handlers
│   ├── requirements.txt            # Python dependencies (ortools, fastapi, etc.)
│   ├── data/
│   │   ├── seed_data.py            # Deterministic flood scenario (7 zones, 3 depots)
│   │   └── state_store.py          # Operational state store & audit logs
│   ├── models/
│   │   └── schemas.py              # Pydantic schemas for zones, runs, allocations
│   ├── services/
│   │   ├── optimization_engine.py  # Google OR-Tools MIP solver & baseline benchmarker
│   │   ├── reoptimization_engine.py# Dynamic event triggers & delta analysis
│   │   ├── priority_engine.py      # Multi-factor explainable priority scorer
│   │   ├── demand_estimator.py     # Sphere Humanitarian standards demand engine
│   │   ├── routing_engine.py       # Dijkstra graph & road blockage avoidance
│   │   ├── nlp_extractor.py        # Unstructured dispatch text entity extractor
│   │   └── data_adapters.py        # Level 1/2/3 multi-tiered data adapters
│   └── utils/
│       └── time_utils.py           # UTC timezone-aware datetime helpers
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Core application controller
│   │   ├── types/index.ts          # TypeScript domain interfaces
│   │   ├── services/api.ts         # REST API client
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Top command bar with live telemetry
│   │   │   └── Sidebar.tsx         # Tactical navigation sidebar
│   │   └── views/
│   │       ├── DashboardView.tsx   # Executive command dashboard
│   │       ├── MapView.tsx         # Interactive Leaflet GIS operational map
│   │       ├── OptimizationView.tsx# Weight tuning, allocations & "Why?" modal
│   │       ├── SimulationView.tsx  # What-If sandbox (road closure, surge, stock loss)
│   │       ├── BenchmarkView.tsx   # Side-by-side Baseline vs. ResQGrid table
│   │       ├── ResourceGapView.tsx # Shortage breakdown & fulfillment progress
│   │       ├── ResourcesView.tsx   # Warehouses, hospitals, and shelters
│   │       ├── FieldReportsView.tsx# NLP dispatch ingestion form & verified cards
│   │       ├── AnalyticsView.tsx   # Recharts charts for commodities & response times
│   │       ├── AuditView.tsx       # Immutable governance log
│   │       └── DemoModeView.tsx    # Guided 6-step Hackathon Evaluator Flow
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.app.json
├── tests/
│   └── test_resqgrid.py            # 7 unit tests (Optimization, Routing, NLP, Benchmarks)
├── run_resqgrid.py                 # Unified 1-click startup script
└── README.md                       # Comprehensive documentation
```

---

## 7. Installation & Quick Start

### Prerequisites
- Python 3.10+ (Python 3.14 tested and supported)
- Node.js v18+ & npm

### Step 1: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Run the Complete Application (Unified Launcher)
```bash
python run_resqgrid.py
```
This automatically boots:
- **FastAPI Backend**: `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`)
- **React Command Center**: `http://localhost:5173`

---

## 8. Running Automated Verification Tests

ResQGrid includes an automated test suite verifying mathematical constraints, non-negativity of inventories, road closure avoidance, and NLP extraction:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

Sample output:
```
Ran 7 tests in 0.055s
OK
- Benchmark metric 'Average Response Time': Baseline=30.6m, Optimized=15.4m -> 49.7% lift
- Demand Estimator verified across all 7 disaster sectors.
- NLP Extractor verified: Extracted {'water': 1500, 'medical_kits': 50, 'ambulances': 3} with HIGH CONFIDENCE
- OR-Tools MIP Hard Constraints verified! Allocations: 31, Runtime: 11.83ms
- Priority Engine verified: Slum (84.7) > Green Valley (23.2)
- Dynamic Re-Optimization verified: Detour rerouting executed.
- Routing Engine verified: Successfully circumvented blocked road ROAD-R17.
```

---

## 9. Demonstration Walkthrough (Live Evaluator Flow)

Navigate to **Demo Flow** in the sidebar:

1. **Step 1: Disaster Event Triggered**  
   245mm monsoon rainfall inundates the Brahmaputra Basin. River swell rises 2.8m above danger mark. 45,800 citizens impacted across 7 wards.
2. **Step 2: Multi-Source Signal Fusion**  
   Weather telemetry, OpenStreetMap road geometries, hospital ICU saturation, and warehouse stock levels are ingested.
3. **Step 3: Explainable Priority Engine**  
   Calculates multi-factor urgency scores. `South Slum Cluster` (96.8) and `Riverbank Colony` (94.5) are flagged as critical life-threat zones.
4. **Step 4: Constraint-Aware Optimization (OR-Tools)**  
   Click `⚡ OPTIMIZE ALLOCATION`. In ~15ms, the MIP solver outputs 31 allocations respecting all depot stocks, vehicle limits, and humanitarian equity. Click **Why?** on any item to view mathematical justifications.
5. **Step 5: Road Breach & Dynamic Re-Optimization**  
   Click `🚧 CLOSE ROAD & RE-OPTIMIZE`. `ROAD-R17` (North Bridge Causeway) is closed. The re-optimization engine reroutes dispatches through `WH-EAST` via the highway bypass.
6. **Step 6: Empirical Baseline vs. ResQGrid Benchmark**  
   View the side-by-side matrix demonstrating a **+49.7% reduction in response time** and **65% lower equity gap** over manual nearest-depot heuristics.

---

## 10. Security & Governance

- **Human-in-the-Loop Protocol**: AI suggests; authorized officers review, approve, modify (with mandatory operational rationale), or reject.
- **Immutable Audit Logging**: Every critical action, trigger, and dispatch override is recorded with timestamps, user credentials, and operational metadata.
- **Air-Gapped / Offline Readiness**: Mathematical solver runs locally with zero dependence on paid proprietary cloud APIs.
