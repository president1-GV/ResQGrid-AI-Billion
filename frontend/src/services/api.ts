import {
  SystemState,
  OptimizationRun,
  BenchmarkComparison,
  FieldReport,
  AuditLog,
  OptimizationObjectiveWeights,
  AllocationItem,
  WorkforceTeam,
  DispatchItem,
  SyntheticScenario,
  IncidentCreateRequest,
  IncidentPipelineResult,
  ExecutiveReports,
  AuthOfficer,
  LoginResponse
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('resqgrid_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('resqgrid_token', token);
  } else {
    localStorage.removeItem('resqgrid_token');
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginOfficer(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Authentication failed');
  }
  const data: LoginResponse = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthOfficer> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch current user profile');
  return res.json();
}

export async function fetchAvailableOfficers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/auth/officers`);
  if (!res.ok) throw new Error('Failed to fetch command officers');
  return res.json();
}

export async function logoutOfficer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } finally {
    setStoredToken(null);
  }
}

export async function fetchState(): Promise<SystemState> {
  const res = await fetch(`${API_BASE}/state`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch system state');
  return res.json();
}

export async function runOptimize(weights?: OptimizationObjectiveWeights): Promise<OptimizationRun> {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  });
  if (!res.ok) throw new Error('Optimization failed');
  return res.json();
}

export async function runBenchmark(): Promise<{ resqgrid_run: OptimizationRun; comparisons: BenchmarkComparison[] }> {
  const res = await fetch(`${API_BASE}/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Benchmark calculation failed');
  return res.json();
}

export async function triggerRoadClosure(roadId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/reoptimize/road-closure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ road_id: roadId, reason }),
  });
  if (!res.ok) throw new Error('Failed to trigger road closure');
  return res.json();
}

export async function triggerDemandSpike(zoneId: string, multiplier: number, reason?: string) {
  const res = await fetch(`${API_BASE}/reoptimize/demand-spike`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone_id: zoneId, multiplier, reason }),
  });
  if (!res.ok) throw new Error('Failed to trigger demand spike');
  return res.json();
}

export async function triggerWarehouseReduction(warehouseId: string, resourceType: string, fractionRemaining: number) {
  const res = await fetch(`${API_BASE}/reoptimize/warehouse-shortage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      warehouse_id: warehouseId,
      resource_type: resourceType,
      fraction_remaining: fractionRemaining,
    }),
  });
  if (!res.ok) throw new Error('Failed to trigger warehouse reduction');
  return res.json();
}

export async function actOnAllocation(
  allocationId: string,
  action: 'APPROVE' | 'MODIFY' | 'REJECT' | 'DISPATCH',
  officerName: string,
  reason?: string,
  modifiedQty?: number
): Promise<AllocationItem> {
  const res = await fetch(`${API_BASE}/allocations/${allocationId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      officer_name: officerName,
      reason,
      modified_quantity: modifiedQty,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Allocation action failed');
  }
  return res.json();
}

export async function fetchFieldReports(): Promise<FieldReport[]> {
  const res = await fetch(`${API_BASE}/field-reports`);
  if (!res.ok) throw new Error('Failed to fetch field reports');
  return res.json();
}

export async function submitFieldReport(data: {
  reporter_name: string;
  reporter_role: string;
  location_name: string;
  raw_text: string;
  lat?: number;
  lon?: number;
}): Promise<FieldReport> {
  const res = await fetch(`${API_BASE}/field-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit field report');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchWeather() {
  const res = await fetch(`${API_BASE}/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

export async function resetSystemState() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset system state');
  return res.json();
}

export async function fetchWorkforce(): Promise<WorkforceTeam[]> {
  const res = await fetch(`${API_BASE}/workforce`);
  if (!res.ok) throw new Error('Failed to fetch workforce');
  return res.json();
}

export async function updateWorkforceStatus(teamId: string, availability: string, assignment?: string): Promise<WorkforceTeam> {
  const res = await fetch(`${API_BASE}/workforce/${teamId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability, assignment }),
  });
  if (!res.ok) throw new Error('Failed to update workforce status');
  return res.json();
}

export async function fetchDispatches(): Promise<DispatchItem[]> {
  const res = await fetch(`${API_BASE}/dispatches`);
  if (!res.ok) throw new Error('Failed to fetch dispatches');
  return res.json();
}

export async function updateDispatchStatus(dispatchId: string, status: string, notes?: string): Promise<DispatchItem> {
  const res = await fetch(`${API_BASE}/dispatches/${dispatchId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update dispatch status');
  return res.json();
}

export async function fetchDemoScenarios(): Promise<SyntheticScenario[]> {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch demo scenarios');
  return res.json();
}

export async function loadDemoScenario(scenarioId: string): Promise<{ scenario: SyntheticScenario; run: OptimizationRun; message: string }> {
  const res = await fetch(`${API_BASE}/demo/scenarios/${scenarioId}/load`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo scenario');
  return res.json();
}

export async function createIncidentAndRun(data: IncidentCreateRequest): Promise<IncidentPipelineResult> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Incident pipeline execution failed');
  }
  return res.json();
}

export async function fetchExecutiveReports(): Promise<ExecutiveReports> {
  const res = await fetch(`${API_BASE}/reports/generate`);
  if (!res.ok) throw new Error('Failed to generate executive reports');
  return res.json();
}

export async function runHardEvaluatorTest(): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/hard-evaluator-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Hard evaluator test execution failed');
  }
  return res.json();
}

export async function fetchModelsMonitoring(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/models`);
  if (!res.ok) throw new Error('Failed to fetch models monitoring');
  return res.json();
}

export async function fetchSystemStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchGisLayers(): Promise<any> {
  const res = await fetch(`${API_BASE}/gis/layers`);
  if (!res.ok) throw new Error('Failed to fetch GIS layers');
  return res.json();
}

export async function approveAllAllocations(officerName: string = 'Chief Operations Officer', role: string = 'OPERATIONS_OFFICER'): Promise<any> {
  const res = await fetch(`${API_BASE}/allocations/approve-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_name: officerName, role }),
  });
  if (!res.ok) throw new Error('Failed to bulk approve allocations');
  return res.json();
}

// ============================================================
// DATASET INTELLIGENCE & LLM APIs
// ============================================================

export async function fetchDatasets(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch dataset catalog');
  return res.json();
}

export async function fetchDataset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch dataset ${id}`);
  return res.json();
}

export async function ingestDataset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}/ingest`, { method: 'POST' });
  if (!res.ok) {
    let detail = `Failed to ingest dataset ${id}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      try {
        const text = await res.text();
        detail = text || detail;
      } catch {
        // fallback
      }
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function validateDataset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}/validate`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to validate dataset ${id}`);
  return res.json();
}

export async function fetchDatasetQuality(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}/quality`);
  if (!res.ok) throw new Error(`Failed to fetch quality report for ${id}`);
  return res.json();
}

export async function fetchDatasetLineage(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}/lineage`);
  if (!res.ok) throw new Error(`Failed to fetch lineage for ${id}`);
  return res.json();
}

export async function extractLLMEvent(text: string, sourceRef: string = 'FIELD-DISPATCH', provider: string = 'local'): Promise<any> {
  const res = await fetch(`${API_BASE}/llm/extract-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_reference: sourceRef, provider }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'LLM extraction failed');
  }
  return res.json();
}

export async function fetchPendingReviews(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/data/review`);
  if (!res.ok) throw new Error('Failed to fetch review queue');
  return res.json();
}

export async function submitReviewAction(action: { extraction_id: string; action: string; rationale?: string; modified_data?: any; reviewer_role?: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/data/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit review action');
  }
  return res.json();
}

export async function trainDemandModel(params: { dataset_id?: string; n_estimators?: number; learning_rate?: number } = {}): Promise<any> {
  const res = await fetch(`${API_BASE}/models/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_type: 'demand_gradient_boosting',
      dataset_id: params.dataset_id || 'india_flood_inventory',
      test_split: 0.2,
      n_estimators: params.n_estimators || 80,
      learning_rate: params.learning_rate || 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Model training failed');
  }
  return res.json();
}

export async function fetchLiveWeather(lat: number = 26.1445, lon: number = 91.7362): Promise<any> {
  const res = await fetch(`${API_BASE}/weather/live?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Failed to fetch live weather telemetry');
  return res.json();
}


export async function fetchTravelMatrix(): Promise<any> {
  const res = await fetch(`${API_BASE}/gis/travel-matrix`);
  if (!res.ok) throw new Error('Failed to fetch travel matrix');
  return res.json();
}

export async function toggleRoadStatus(roadId: string, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/roads/${roadId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(`Failed to toggle road ${roadId}`);
  return res.json();
}

export async function calculateRoute(startId: string, endId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/routing/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_id: startId, end_id: endId }),
  });
  if (!res.ok) throw new Error('Failed to calculate route');
  return res.json();
}

export async function fetchGisStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/gis/status`);
  if (!res.ok) throw new Error('Failed to fetch GIS status');
  return res.json();
}

export async function fetchGisDatasetLayers(): Promise<any> {
  const res = await fetch(`${API_BASE}/gis/dataset-layers`);
  if (!res.ok) throw new Error('Failed to fetch GIS dataset layers');
  return res.json();
}

export async function fetchActiveScenario(): Promise<any> {
  const res = await fetch(`${API_BASE}/scenario/active`);
  if (!res.ok) throw new Error('Failed to fetch active scenario');
  return res.json();
}

export async function switchScenario(scenario: 'flood' | 'tsunami'): Promise<any> {
  const res = await fetch(`${API_BASE}/scenario/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error(`Failed to switch scenario to ${scenario}`);
  return res.json();
}

