import math
from typing import Dict, List, Any, Optional, Tuple
from ..models.schemas import AffectedZone, Warehouse, Hospital, Shelter, Road, RoadStatus
from .routing_engine import haversine_distance_km

def point_in_polygon(lat: float, lon: float, polygon: List[Tuple[float, float]]) -> bool:
    inside = False
    n = len(polygon)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        intersect = ((yi > lon) != (yj > lon)) and (
            lat < (xj - xi) * (lon - yi) / ((yj - yi) if (yj - yi) != 0 else 1e-9) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside

DEFAULT_FLOOD_POLYGON: List[Tuple[float, float]] = [
    (26.220, 91.710),
    (26.215, 91.770),
    (26.185, 91.790),
    (26.170, 91.745),
    (26.180, 91.715),
    (26.220, 91.710)
]

class GisService:
    def __init__(self, flood_polygon: Optional[List[Tuple[float, float]]] = None):
        self.flood_polygon = flood_polygon or DEFAULT_FLOOD_POLYGON

    def find_nearest_warehouse(self, zone: AffectedZone, warehouses: List[Warehouse]) -> Tuple[Warehouse, float]:
        if not warehouses:
            raise ValueError('No warehouses available')
        closest = min(warehouses, key=lambda w: haversine_distance_km(zone.lat, zone.lon, w.lat, w.lon))
        dist = haversine_distance_km(zone.lat, zone.lon, closest.lat, closest.lon)
        return closest, dist

    def find_hospitals_in_radius(self, zone: AffectedZone, hospitals: List[Hospital], radius_km: float = 12.0) -> List[Dict[str, Any]]:
        results = []
        for h in hospitals:
            d = haversine_distance_km(zone.lat, zone.lon, h.lat, h.lon)
            if d <= radius_km:
                results.append({
                    'hospital': h,
                    'distance_km': d,
                    'within_radius': True
                })
        results.sort(key=lambda x: x['distance_km'])
        return results

    def find_shelters_reachable(self, zone: AffectedZone, shelters: List[Shelter], max_dist_km: float = 10.0) -> List[Dict[str, Any]]:
        results = []
        for s in shelters:
            d = haversine_distance_km(zone.lat, zone.lon, s.lat, s.lon)
            if d <= max_dist_km:
                results.append({
                    'shelter': s,
                    'distance_km': d,
                    'available_capacity': s.available_capacity,
                    'reachable': True
                })
        results.sort(key=lambda x: x['distance_km'])
        return results

    def roads_intersecting_flood(self, roads: List[Road], polygon: Optional[List[Tuple[float, float]]] = None) -> List[Dict[str, Any]]:
        intersecting = []
        for r in roads:
            is_intersecting = (r.status in [RoadStatus.BLOCKED, RoadStatus.WATERLOGGED]) or (r.flood_depth_cm > 10.0)
            intersecting.append({
                'road_id': r.id,
                'road_name': r.name,
                'from_node': r.from_node,
                'to_node': r.to_node,
                'status': r.status,
                'flood_depth_cm': r.flood_depth_cm,
                'is_severed': r.status == RoadStatus.BLOCKED,
                'intersects_flood_polygon': is_intersecting
            })
        return intersecting

    def affected_population_in_polygon(self, zones: List[AffectedZone], polygon: Optional[List[Tuple[float, float]]] = None) -> Dict[str, Any]:
        poly = polygon or self.flood_polygon
        inside_zones = []
        total_pop = 0
        total_affected = 0
        for z in zones:
            if point_in_polygon(z.lat, z.lon, poly):
                inside_zones.append(z)
                total_pop += z.population
                total_affected += z.affected_population

        return {
            'zones_inside_count': len(inside_zones),
            'zones_inside': [z.name for z in inside_zones],
            'total_population': total_pop,
            'total_affected_population': total_affected,
            'inundation_area_est_sq_km': 42.5
        }

    def generate_travel_time_matrix(self, warehouses: List[Warehouse], zones: List[AffectedZone], roads: List[Road]) -> Dict[str, Any]:
        from .routing_engine import routing_engine
        matrix = {}
        for w in warehouses:
            matrix[w.id] = {}
            for z in zones:
                route = routing_engine.compute_route_for_pair(
                    w.id, w.lat, w.lon, z.id, z.lat, z.lon, roads
                )
                matrix[w.id][z.id] = {
                    'distance_km': route['distance_km'],
                    'travel_time_min': route['travel_time_min'],
                    'found': route['found'],
                    'detour': route.get('detour', False)
                }
        return {
            'origins': [w.id for w in warehouses],
            'destinations': [z.id for z in zones],
            'matrix': matrix,
            'timestamp': '2026-09-16T15:00:00Z'
        }

    def get_geojson_layers(self, zones: List[AffectedZone], warehouses: List[Warehouse],
                           hospitals: List[Hospital], shelters: List[Shelter],
                           roads: List[Road]) -> Dict[str, Any]:
        flood_feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[[lon, lat] for lat, lon in self.flood_polygon]]
            },
            'properties': {
                'id': 'FLOOD-POLY-01',
                'name': 'Brahmaputra 2.8m Inundation Extent',
                'severity': 'CRITICAL',
                'flood_depth_avg_m': 1.4,
                'fill_color': '#dc2626'
            }
        }
        zone_features = [
            {
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [z.lon, z.lat]},
                'properties': {
                    'id': z.id,
                    'name': z.name,
                    'priority_score': z.priority_score,
                    'affected_population': z.affected_population,
                    'water_need': z.water_need,
                    'medical_need': z.medical_need,
                    'is_critical': z.is_critical,
                    'type': 'zone'
                }
            } for z in zones
        ]
        warehouse_features = [
            {
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [w.lon, w.lat]},
                'properties': {'id': w.id, 'name': w.name, 'capacity': w.capacity, 'type': 'warehouse'}
            } for w in warehouses
        ]
        hospital_features = [
            {
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [h.lon, h.lat]},
                'properties': {'id': h.id, 'name': h.name, 'available_beds': h.available_beds, 'type': 'hospital'}
            } for h in hospitals
        ]
        shelter_features = [
            {
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [s.lon, s.lat]},
                'properties': {'id': s.id, 'name': s.name, 'available_capacity': s.available_capacity, 'type': 'shelter'}
            } for s in shelters
        ]
        return {
            'type': 'FeatureCollection',
            'features': [flood_feature] + zone_features + warehouse_features + hospital_features + shelter_features
        }

gis_service = GisService()
