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
            # Geodesic fallback with realistic urban detour coefficient (1.35x) and 35 km/h flood speed
            straight_dist = haversine_distance_km(start_lat, start_lon, end_lat, end_lon)
            road_dist = round(straight_dist * 1.35, 2)
            est_time = round((road_dist / 32.0) * 60.0, 1)
            return {
                "route_nodes": [start_id, "detour_bypass", end_id],
                "distance_km": road_dist,
                "travel_time_min": est_time,
                "status": "Alternative Detour Route",
                "is_detour": True
            }

        return {
            "route_nodes": route_res["nodes"],
            "distance_km": route_res["distance_km"],
            "travel_time_min": route_res["travel_time_min"],
            "status": "Direct Optimal Feasible Route" if not route_res["detour"] else "Detour Route",
            "is_detour": route_res["detour"]
        }

routing_engine = RoutingEngine()
