"""
ResQGrid AI Billion - Feature Store
Generates and versions multi-domain feature vectors across weather,
disaster impact, demographics, resource availability, and network accessibility.
"""

from typing import Dict, Any, List, Optional
import datetime


class FeatureStore:
    """Manages disaster prediction and allocation feature vectors."""

    _cached_features: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def generate_features_for_zone(
        cls,
        zone_id: str,
        population: int,
        vulnerability: float,
        rainfall_mm: float,
        flooded_area_sqkm: float,
        duration_days: float = 2.0,
        hospitals_available: int = 2,
        roads_blocked_count: int = 0
    ) -> Dict[str, Any]:
        """Assembles normalized tabular features for machine learning models."""

        # Derived metrics
        pop_density = round(population / max(flooded_area_sqkm, 0.5), 1)
        rain_severity = min(round(rainfall_mm / 250.0, 3), 1.5)  # Normalized relative to severe 250mm
        network_impairment = min(round(roads_blocked_count * 0.25, 2), 1.0)
        accessible_ratio = round(max(0.0, 1.0 - network_impairment), 2)

        feature_vector = {
            "feature_version": "v1.2",
            "zone_id": zone_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            # Weather Features
            "rainfall_mm": float(rainfall_mm),
            "rainfall_severity_index": rain_severity,
            # Disaster Features
            "flooded_area_sqkm": float(flooded_area_sqkm),
            "event_duration_days": float(duration_days),
            # Social Demographics
            "population": int(population),
            "population_density": pop_density,
            "vulnerability_score": float(vulnerability),
            # Health & Infrastructure
            "hospitals_available": int(hospitals_available),
            "accessible_roads_ratio": accessible_ratio,
            "roads_blocked_count": int(roads_blocked_count),
        }

        cls._cached_features[zone_id] = feature_vector
        return feature_vector

    @classmethod
    def get_features(cls, zone_id: Optional[str] = None) -> Dict[str, Any]:
        if zone_id and zone_id in cls._cached_features:
            return cls._cached_features[zone_id]
        return cls._cached_features
