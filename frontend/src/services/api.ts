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
  ExecutiveReports
} from '../types';

const API_BASE = '/api';

export async function fetchState(): Promise<SystemState> {
  const res = await fetch(`${API_BASE}/state`);
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

