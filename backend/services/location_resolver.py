"""
ResQGrid AI Billion - Location Resolver
Geocodes names of disaster zones, villages, and infrastructure points using
OSM Nominatim with Indian Disaster Gazetteer fallback and ambiguity detection.
"""

from typing import List, Dict, Any, Optional
from backend.models.dataset_schemas import LLMExtractedLocation, LocationCandidate
from backend.services.external_adapters import OpenStreetMapGeocoder


# Local high-reliability gazetteer for disaster-prone Indian regions
INDIAN_DISTRICT_GAZETTEER = {
    "guwahati": {"name": "Guwahati", "lat": 26.1445, "lon": 91.7362, "district": "Kamrup Metropolitan", "state": "Assam"},
    "silchar": {"name": "Silchar", "lat": 24.8333, "lon": 92.7789, "district": "Cachar", "state": "Assam"},
    "dibrugarh": {"name": "Dibrugarh", "lat": 27.4728, "lon": 94.9120, "district": "Dibrugarh", "state": "Assam"},
    "patna": {"name": "Patna", "lat": 25.5941, "lon": 85.1376, "district": "Patna", "state": "Bihar"},
    "darbhanga": {"name": "Darbhanga", "lat": 26.1542, "lon": 85.8918, "district": "Darbhanga", "state": "Bihar"},
    "wayanad": {"name": "Wayanad", "lat": 11.6854, "lon": 76.1320, "district": "Wayanad", "state": "Kerala"},
    "puri": {"name": "Puri", "lat": 19.8135, "lon": 85.8312, "district": "Puri", "state": "Odisha"},
    "cuttack": {"name": "Cuttack", "lat": 20.4625, "lon": 85.8828, "district": "Cuttack", "state": "Odisha"},
    "chamoli": {"name": "Chamoli", "lat": 30.2937, "lon": 79.5603, "district": "Chamoli", "state": "Uttarakhand"},
    "uttarkashi": {"name": "Uttarkashi", "lat": 30.7268, "lon": 78.4354, "district": "Uttarkashi", "state": "Uttarakhand"},
    "south slum cluster": {"name": "South Slum Cluster", "lat": 26.1150, "lon": 91.7450, "district": "Kamrup Metropolitan", "state": "Assam"},
    "riverbank colony": {"name": "Riverbank Colony", "lat": 26.1750, "lon": 91.7300, "district": "Kamrup Metropolitan", "state": "Assam"},
    "north ward": {"name": "North Ward", "lat": 26.1950, "lon": 91.7550, "district": "Kamrup Metropolitan", "state": "Assam"},
    "east industrial belt": {"name": "East Industrial Belt", "lat": 26.1400, "lon": 91.8200, "district": "Kamrup Metropolitan", "state": "Assam"},
    "west market district": {"name": "West Market District", "lat": 26.1500, "lon": 91.6900, "district": "Kamrup Metropolitan", "state": "Assam"},
}


class LocationResolver:
    """Resolves disaster report locations to coordinates with ambiguity detection."""

    @classmethod
    def resolve(cls, location_query: Optional[str]) -> LLMExtractedLocation:
        if not location_query or location_query.strip() == "":
            return LLMExtractedLocation(
                name=None,
                latitude=None,
                longitude=None,
                district=None,
                state=None,
                resolution_confidence=0.0,
                is_ambiguous=False,
                candidate_matches=[],
                source="Not provided in source"
            )

        clean_query = location_query.strip().lower()

        # 1. Check local authoritative gazetteer
        for key, loc in INDIAN_DISTRICT_GAZETTEER.items():
            if key in clean_query or clean_query in key:
                return LLMExtractedLocation(
                    name=loc["name"],
                    latitude=loc["lat"],
                    longitude=loc["lon"],
                    district=loc["district"],
                    state=loc["state"],
                    resolution_confidence=0.98,
                    is_ambiguous=False,
                    candidate_matches=[],
                    source="Indian Disaster Gazetteer"
                )

        # 2. Query OSM Nominatim
        osm_results = OpenStreetMapGeocoder.resolve_location(location_query)
        if len(osm_results) == 1:
            best = osm_results[0]
            return LLMExtractedLocation(
                name=best["name"],
                latitude=best["latitude"],
                longitude=best["longitude"],
                district=best["district"],
                state=best["state"],
                resolution_confidence=0.90,
                is_ambiguous=False,
                candidate_matches=[],
                source="OpenStreetMap Nominatim"
            )
        elif len(osm_results) > 1:
            # Ambiguity detected!
            candidates = [
                LocationCandidate(
                    name=c["name"],
                    latitude=c["latitude"],
                    longitude=c["longitude"],
                    district=c["district"],
                    state=c["state"],
                    confidence=c["confidence"],
                    source=c["source"]
                ) for c in osm_results
            ]
            primary = candidates[0]
            return LLMExtractedLocation(
                name=primary.name,
                latitude=primary.latitude,
                longitude=primary.longitude,
                district=primary.district,
                state=primary.state,
                resolution_confidence=0.75,
                is_ambiguous=True,
                candidate_matches=candidates,
                source="OpenStreetMap Nominatim (Ambiguous)"
            )

        # 3. Unresolved fallback
        return LLMExtractedLocation(
            name=location_query,
            latitude=None,
            longitude=None,
            district="Unknown District",
            state="India",
            resolution_confidence=0.30,
            is_ambiguous=True,
            candidate_matches=[],
            source="Unresolved Location (Requires Human Geocoding)"
        )
