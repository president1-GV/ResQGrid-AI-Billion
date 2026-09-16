import {
  SystemState,
  OptimizationRun,
  BenchmarkComparison,
  FieldReport,
  AuditLog,
  OptimizationObjectiveWeights,
  AllocationItem
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
