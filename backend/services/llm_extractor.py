"""
ResQGrid AI Billion - LLM & NLP Data Extraction Engine
Strict Pydantic-validated entity extraction with hallucination controls,
confidence scoring, and location resolution.
"""

import os
import re
import json
import uuid
import datetime
from typing import Dict, Any, Optional, List
from backend.models.dataset_schemas import (
    LLMExtractionInput,
    LLMExtractionOutput,
    LLMExtractedLocation,
    LLMExtractedMedical,
    LLMExtractedRoad
)
from backend.services.location_resolver import LocationResolver


class LLMProvider:
    """Base interface for LLM extraction providers."""
    def extract(self, text: str, source_ref: str) -> LLMExtractionOutput:
        raise NotImplementedError


class LocalNLPProvider(LLMProvider):
    """
    Pattern-guided, rule-verified entity extraction engine with strict hallucination controls.
    Does not invent quantities or coordinates. If absent, sets null with 'Not provided in source'.
    """

    DISASTER_KEYWORDS = {
        "flood": ["flood", "flooding", "waterlogging", "inundated", "submerged", "river overflow", "breach"],
        "cyclone": ["cyclone", "hurricane", "typhoon", "high wind", "storm surge", "gale"],
        "earthquake": ["earthquake", "tremor", "aftershock", "seismic", "building collapse"],
        "landslide": ["landslide", "mudslide", "debris flow", "rockfall"]
    }

    SEVERITY_KEYWORDS = {
        "CRITICAL": ["critical", "catastrophic", "life-threat", "extreme", "severe", "code red", "perishing", "submerged"],
        "HIGH": ["high", "heavy", "serious", "urgent", "rising rapidly", "stranded", "cut off"],
        "MODERATE": ["moderate", "medium", "manageable", "minor injuries"],
        "LOW": ["low", "stable", "receding", "under control"]
    }

    def extract(self, text: str, source_ref: str = "FIELD-DISPATCH") -> LLMExtractionOutput:
        extraction_id = f"EXT-{uuid.uuid4().hex[:8].upper()}"
        field_conf: Dict[str, float] = {}
        missing_fields: List[str] = []
        hallucination_warnings: List[str] = []
        flag_for_review = False

        # 1. Event Type Detection
        event_type = None
        text_lower = text.lower()
        for dtype, kws in self.DISASTER_KEYWORDS.items():
            if any(kw in text_lower for kw in kws):
                event_type = dtype
                field_conf["event_type"] = 0.94
                break
        if not event_type:
            missing_fields.append("event_type")
            field_conf["event_type"] = 0.0
            hallucination_warnings.append("Event type not specified in source report.")

        # 2. Location Extraction & Resolution
        # Look for phrases: "in <Location>", "at <Location>", "near <Location>", "<Location> has..."
        location_raw = None
        loc_patterns = [
            r"(?:in|at|near|around|village|ward|sector|district)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:has|is|reported|facing|residents)"
        ]
        for pat in loc_patterns:
            match = re.search(pat, text)
            if match:
                candidate_loc = match.group(1).strip()
                if candidate_loc.lower() not in ["residents", "hospital", "warehouse", "bridge", "road", "water", "food", "high", "urgent"]:
                    location_raw = candidate_loc
                    break

        resolved_loc = LocationResolver.resolve(location_raw)
        if resolved_loc.name is None:
            missing_fields.append("location")
            field_conf["location"] = 0.0
            hallucination_warnings.append("Location coordinates cannot be invented; location missing from report.")
        else:
            field_conf["location"] = resolved_loc.resolution_confidence
            if resolved_loc.is_ambiguous:
                flag_for_review = True
                hallucination_warnings.append(f"Multiple geographic matches found for '{resolved_loc.name}'. Human confirmation required.")

        # 3. Affected Population
        pop_patterns = [
            r"(\d+(?:,\d+)?)\s*(?:people|citizens|residents|persons|villagers|families|souls)",
            r"(?:trapped|stranded|affected|displaced)\s*(?:around|approx|about)?\s*(\d+(?:,\d+)?)"
        ]
        affected_pop = None
        for pat in pop_patterns:
            match = re.search(pat, text_lower)
            if match:
                try:
                    num_str = match.group(1).replace(",", "")
                    affected_pop = int(num_str)
                    field_conf["affected_population"] = 0.90
                    break
                except ValueError:
                    pass

        if affected_pop is None:
            missing_fields.append("affected_population")
            field_conf["affected_population"] = 0.0
            hallucination_warnings.append("Affected population not provided in source. Set to null.")

        # 4. Severity Estimation
        severity = None
        for sev_level, kws in self.SEVERITY_KEYWORDS.items():
            if any(kw in text_lower for kw in kws):
                severity = sev_level
                field_conf["severity"] = 0.88
                break
        if not severity:
            severity = "MODERATE"
            field_conf["severity"] = 0.40
            missing_fields.append("severity")
            hallucination_warnings.append("Disaster severity not explicitly stated; defaulted to MODERATE with low confidence.")
            flag_for_review = True

        # 5. Medical Needs
        med_priority = None
        patients = None
        crit_injuries = None
        med_exp = None

        if "urgent medical" in text_lower or "critical patient" in text_lower or "emergency medical" in text_lower or "icu" in text_lower:
            med_priority = "CRITICAL"
            field_conf["medical_needs"] = 0.92
            med_exp = "Urgent medical / critical patients mentioned."
        elif "medical" in text_lower or "injured" in text_lower or "doctor" in text_lower:
            med_priority = "HIGH"
            field_conf["medical_needs"] = 0.80
            med_exp = "Medical attention or injuries reported."
        else:
            med_priority = "NORMAL"
            field_conf["medical_needs"] = 0.50
            med_exp = "No specialized medical emergency declared."

        pat_match = re.search(r"(\d+)\s*(?:elderly|patients|injured|victims|casualties)", text_lower)
        if pat_match:
            patients = int(pat_match.group(1))

        medical_needs = LLMExtractedMedical(
            priority=med_priority,
            patients=patients,
            critical_injuries=crit_injuries,
            explanation=med_exp
        )

        # 6. Road & Network Conditions
        road_status = None
        blocked_segments = []
        road_exp = None

        if "blocked" in text_lower or "submerged" in text_lower or "causeway washed" in text_lower or "bridge down" in text_lower or "impassable" in text_lower:
            road_status = "BLOCKED"
            road_exp = "Road or bridge reported impassable or submerged."
            field_conf["road_conditions"] = 0.91
            # Look for specific road names (e.g. Road R17, NH-37, North Bridge)
            road_matches = re.findall(r"(?:road|route|bridge|causeway|nh)\s*([a-z0-9\-]+)", text_lower)
            for rm in road_matches:
                blocked_segments.append(f"ROAD-{rm.upper()}")
        elif "open" in text_lower or "clear" in text_lower or "passable" in text_lower:
            road_status = "OPEN"
            road_exp = "Road network confirmed clear."
            field_conf["road_conditions"] = 0.85
        else:
            road_status = "UNKNOWN"
            road_exp = "Road status not provided in source."
            field_conf["road_conditions"] = 0.0
            missing_fields.append("road_conditions")

        road_conditions = LLMExtractedRoad(
            status=road_status,
            blocked_segments=blocked_segments,
            explanation=road_exp
        )

        # 7. Commodity Demands
        demands: Dict[str, Optional[float]] = {}
        # Water
        water_m = re.search(r"(\d+(?:,\d+)?)\s*(?:liters?|ltrs?|bottles?|packets?)\s*(?:of\s*)?water", text_lower)
        demands["water"] = float(water_m.group(1).replace(",", "")) if water_m else None

        # Food
        food_m = re.search(r"(\d+(?:,\d+)?)\s*(?:food\s*packets?|rations?|meals?)", text_lower)
        demands["food"] = float(food_m.group(1).replace(",", "")) if food_m else None

        # Ambulances
        amb_m = re.search(r"(\d+)\s*ambulances?", text_lower)
        demands["ambulances"] = float(amb_m.group(1)) if amb_m else None

        # Medical kits
        med_m = re.search(r"(\d+)\s*(?:medical\s*kits?|first\s*aid|trauma\s*kits?)", text_lower)
        demands["medical_kits"] = float(med_m.group(1)) if med_m else None

        # Compute overall confidence
        valid_confs = [c for c in field_conf.values() if c > 0.0]
        overall_confidence = round(sum(valid_confs) / len(valid_confs), 2) if valid_confs else 0.40

        if overall_confidence < 0.70 or len(missing_fields) >= 3:
            flag_for_review = True

        return LLMExtractionOutput(
            extraction_id=extraction_id,
            event_type=event_type,
            location=resolved_loc,
            affected_population=affected_pop,
            severity=severity,
            medical_needs=medical_needs,
            road_conditions=road_conditions,
            resource_demands=demands,
            confidence=overall_confidence,
            field_confidence=field_conf,
            missing_fields=missing_fields,
            hallucination_warnings=hallucination_warnings,
            flag_for_review=flag_for_review,
            source_reference=source_ref,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            review_status="FLAGGED_FOR_REVIEW" if flag_for_review else "PENDING_REVIEW"
        )


class LLMExtractor:
    """Master facade for LLM extraction with provider dispatch."""

    _providers = {
        "local": LocalNLPProvider(),
        "mock": LocalNLPProvider(),
    }

    @classmethod
    def extract_event(cls, input_data: LLMExtractionInput) -> LLMExtractionOutput:
        provider = cls._providers.get(input_data.provider or "local", cls._providers["local"])
        return provider.extract(input_data.text, input_data.source_reference or "FIELD-DISPATCH")
