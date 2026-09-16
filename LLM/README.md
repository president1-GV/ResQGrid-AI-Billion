# RESQGRID AI — LOCAL AI/ML & DECISION SUPPORT SYSTEM

## 1. System Architecture

ResQGrid AI operates as a unified, offline-first disaster intelligence platform:

```
                      ┌────────────────────────────────────────┐
                      │    Disaster Telemetry & Historical     │
                      │    Flood Inventory (IFI v3.0 / EM-DAT) │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Validation & Schema Integrity        │
                      │   (python -m LLM.preprocessing.valid.) │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Zero-Leakage Preprocessing Pipeline  │
                      │   (Temporal Splits: Train/Val/Test)    │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Multi-Commodity Demand Engine        │
                      │   (Gradient Boosting Regressor v1.0.0) │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Empirical Uncertainty Quantiles      │
                      │   (P10–P90 Residual Intervals)         │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Constrained Optimization Engine      │
                      │   (Google OR-Tools MIP / SCIP Solver)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Dynamic Reallocation & Explanations  │
                      │   (Operator-Facing Decision Support)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Local Disaster SOP RAG Knowledge     │
                      │   (Sphere Standards & NDRF Protocols)  │
                      └────────────────────────────────────────┘
```

---

## 2. Dataset Inventory & Provenance

All datasets are audited programmatically in `LLM/datasets/DATASET_INVENTORY.md`:
1. **India Flood Inventory (IFI v3.0)**: 6,876 historical events across all Indian states (1967–2023) from HydroSense Lab, IIT Delhi (Zenodo DOI: 10.5281/zenodo.13636502).
2. **District Flooded Area**: 732 Indian districts with satellite inundation exposure baselines.
3. **District Flood Impact**: Demographic vulnerability, population baseline, and historical mean duration across 732 districts.
4. **EM-DAT Disaster Profiles**: Macro-economic casualties and damage records from CRED/HDX.

---

## 3. Quickstart Commands

```bash
# 1. Validate dataset schema and coordinate integrity
python -m LLM.preprocessing.validate_data

# 2. Clean data and generate zero-leakage temporal splits (Train/Val/Test)
python -m LLM.preprocessing.prepare_data

# 3. Train baseline (Ridge) and advanced (Gradient Boosting) models
python -m LLM.training.train

# 4. Run held-out test evaluation and uncertainty benchmarks
python -m LLM.evaluation.evaluate

# 5. Execute CLI inference, optimization, and explanation
python -m LLM.inference.predict

# 6. Run automated test suite (hard constraints, reallocation, geospatial, RAG)
python -m LLM.tests.run_tests
```

---

## 4. Model Cards & Registry

- **Active Model**: `resqgrid-demand-forecaster (v1.0.0)`
- **Artifacts**: Located in `LLM/models/demand_forecasting/v1/`
- **Registry**: Documented in `LLM/models/MODEL_REGISTRY.md`
- **Card**: Detailed in `LLM/models/demand_forecasting/v1/MODEL_CARD.md`
- **Inference Latency**: `0.0194 ms` per sample on local CPU.

---

## 5. Decision Support & Hard Optimization Guarantees

ResQGrid AI guarantees that decision recommendations never violate physical realities:
- **Warehouse Capacity Hard Constraint**: Dispatches cannot exceed available stock.
- **Demand Cap Hard Constraint**: Dispatches cannot exceed zone requirements.
- **Dynamic Reallocation**: Automatically recalculates optimal dispatches and produces explanation diffs when warehouses fail or roads are blocked.
