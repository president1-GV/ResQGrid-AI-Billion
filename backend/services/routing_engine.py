import math
import heapq
from typing import Dict, List, Tuple, Optional
from ..models.schemas import Road, RoadStatus

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

class RoutingEngine:
    def __init__(self):
        pass

    def build_graph(self, roads: List[Road]) -> Dict[str, List[Tuple[str, float, float, str, RoadStatus]]]:
        # adjacency: node -> list of (neighbor_node, distance_km, travel_min, road_id, status)
        adj: Dict[str, List[Tuple[str, float, float, str, RoadStatus]]] = {}
        for r in roads:
            if r.from_node not in adj:
                adj[r.from_node] = []
            if r.to_node not in adj:
                adj[r.to_node] = []

            # Add directed/bidirectional edges
            effective_time = r.standard_travel_min / max(0.2, r.speed_multiplier)
            adj[r.from_node].append((r.to_node, r.distance_km, effective_time, r.id, r.status))
            adj[r.to_node].append((r.from_node, r.distance_km, effective_time, r.id, r.status))
        return adj

    def find_shortest_route(self,
                            start_node: str,
                            end_node: str,
                            roads: List[Road],
                            avoid_blocked: bool = True) -> Dict:
        """
        Dijkstra shortest path respecting road closures.
        If direct road is blocked, finds detour through available network.
        """
        adj = self.build_graph(roads)

        # Priority queue: (total_time_min, current_node, path_nodes, total_dist_km, roads_used)
        pq = [(0.0, start_node, [start_node], 0.0, [])]
        visited = set()

        while pq:
            current_time, u, path, current_dist, edges_used = heapq.heappop(pq)

            if u == end_node:
                return {
                    "found": True,
                    "nodes": path,
                    "distance_km": round(current_dist, 2),
                    "travel_time_min": round(current_time, 1),
                    "edges_used": edges_used,
                    "detour": len(path) > 2
                }

            if u in visited:
                continue
            visited.add(u)

            if u not in adj:
                continue

            for v, dist_km, time_min, road_id, status in adj[u]:
                if avoid_blocked and status == RoadStatus.BLOCKED:
                    continue
                if v not in visited:
                    heapq.heappush(
                        pq,
                        (current_time + time_min, v, path + [v], current_dist + dist_km, edges_used + [road_id])
                    )

        # Fallback if no network path is found
        return {
            "found": False,
            "nodes": [start_node, end_node],
            "distance_km": 15.0, # default estimated penalty
            "travel_time_min": 45.0,
            "edges_used": [],
            "detour": True
        }

    def compute_route_for_pair(self,
                               start_id: str,
                               start_lat: float,
                               start_lon: float,
                               end_id: str,
                               end_lat: float,
                               end_lon: float,
                               roads: List[Road]) -> Dict:
        # Check if direct or connected via road graph
        route_res = self.find_shortest_route(start_id, end_id, roads, avoid_blocked=True)

        if not route_res["found"]:
            # Detour fallback when primary road corridor is severed / impassable
            straight_dist = haversine_distance_km(start_lat, start_lon, end_lat, end_lon)
            road_dist = round(max(15.5, straight_dist * 2.8 + 6.5), 2)
            est_time = round(max(38.0, (road_dist / 18.0) * 60.0), 1)
            return {
                "found": False,
                "route_nodes": [start_id, "detour_bypass", end_id],
                "distance_km": road_dist,
                "travel_time_min": est_time,
                "status": "Alternative Detour Route (Primary Arterial Severed)",
                "is_detour": True
            }

        return {
            "found": True,
            "route_nodes": route_res["nodes"],
            "distance_km": route_res["distance_km"],
            "travel_time_min": route_res["travel_time_min"],
            "status": "Direct Optimal Feasible Route" if not route_res["detour"] else "Detour Route",
            "is_detour": route_res["detour"]
        }

routing_engine = RoutingEngine()

class OfflineDemoRoutingService:
    """
    Clearly labeled DEMO / MOCK Routing Engine.
    Uses Dijkstra shortest path graph over regional road segments
    and Haversine geodesic metrics for realistic transit times.
    """
    def __init__(self):
        self.service_type = "DEMO / OFFLINE MOCK"
        self._cache = {}

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        return haversine_distance_km(lat1, lon1, lat2, lon2)

    def calculate_travel_time(self, distance_km: float, speed_kmh: float = 35.0) -> float:
        return round((distance_km / max(5.0, speed_kmh)) * 60.0, 1)

    def calculate_route(self, start_id: str, start_lat: float, start_lon: float,
                        end_id: str, end_lat: float, end_lon: float,
                        roads: Optional[List[Road]] = None) -> Dict[str, Any]:
        cache_key = f"{start_id}_{end_id}"
        if roads:
            # Hash blocked roads
            blocked = tuple(sorted(r.id for r in roads if r.status == RoadStatus.BLOCKED))
            cache_key += f"_{blocked}"

        if cache_key in self._cache:
            cached_res = dict(self._cache[cache_key])
            cached_res["cached"] = True
            return cached_res

        if roads:
            res = routing_engine.compute_route_for_pair(
                start_id, start_lat, start_lon, end_id, end_lat, end_lon, roads
            )
        else:
            dist = self.calculate_distance(start_lat, start_lon, end_lat, end_lon)
            res = {
                "found": True,
                "route_nodes": [start_id, end_id],
                "distance_km": dist,
                "travel_time_min": self.calculate_travel_time(dist),
                "status": "Direct Geodesic Estimate",
                "is_detour": False
            }

        res["service_provider"] = "OfflineDemoRoutingService [DEMO / OFFLINE MOCK]"
        res["cached"] = False
        self._cache[cache_key] = dict(res)
        return res

    def build_travel_time_matrix(self, origins: List[Dict[str, Any]], destinations: List[Dict[str, Any]],
                                 roads: Optional[List[Road]] = None) -> Dict[str, Any]:
        matrix = {}
        for o in origins:
            matrix[o["id"]] = {}
            for d in destinations:
                r = self.calculate_route(
                    o["id"], o["lat"], o["lon"],
                    d["id"], d["lat"], d["lon"],
                    roads
                )
                matrix[o["id"]][d["id"]] = {
                    "distance_km": r["distance_km"],
                    "travel_time_min": r["travel_time_min"],
                    "is_detour": r.get("is_detour", False)
                }
        return {
            "origins": [o["id"] for o in origins],
            "destinations": [d["id"] for d in destinations],
            "matrix": matrix,
            "provider": self.service_type
        }

offline_demo_routing_service = OfflineDemoRoutingService()

class RoutingService:
    """
    Configurable Routing Service with automatic fallback.
    Connects to live Open Source Routing Machine (OSRM) server when configured,
    or smoothly falls back to OfflineDemoRoutingService.
    """
    def __init__(self, osrm_url: Optional[str] = None):
        import os
        self.osrm_url = osrm_url or os.getenv("OSRM_URL", "")
        self.offline_fallback = offline_demo_routing_service

    def calculate_route(self, start_id: str, start_lat: float, start_lon: float,
                        end_id: str, end_lat: float, end_lon: float,
                        roads: Optional[List[Road]] = None) -> Dict[str, Any]:
        if self.osrm_url:
            try:
                import urllib.request, json
                url = f"{self.osrm_url.rstrip('/')}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=false"
                req = urllib.request.Request(url, headers={"User-Agent": "ResQGrid-OSRM-Client/1.0"})
                with urllib.request.urlopen(req, timeout=1.5) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        if data.get("routes"):
                            route = data["routes"][0]
                            dist_km = round(route["distance"] / 1000.0, 2)
                            time_min = round(route["duration"] / 60.0, 1)
                            return {
                                "found": True,
                                "route_nodes": [start_id, "osrm_waypoint", end_id],
                                "distance_km": dist_km,
                                "travel_time_min": time_min,
                                "status": "Live OSRM Routing",
                                "service_provider": "OSRM (OpenStreetMap)",
                                "is_detour": False
                            }
            except Exception:
                pass  # Fallback to offline demo routing

        # Fallback to offline demo router
        return self.offline_fallback.calculate_route(
            start_id, start_lat, start_lon, end_id, end_lat, end_lon, roads
        )

    def calculate_travel_time(self, distance_km: float, speed_kmh: float = 35.0) -> float:
        return self.offline_fallback.calculate_travel_time(distance_km, speed_kmh)

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        return self.offline_fallback.calculate_distance(lat1, lon1, lat2, lon2)

    def build_travel_time_matrix(self, origins: List[Dict[str, Any]], destinations: List[Dict[str, Any]],
                                 roads: Optional[List[Road]] = None) -> Dict[str, Any]:
        return self.offline_fallback.build_travel_time_matrix(origins, destinations, roads)

routing_service = RoutingService()

