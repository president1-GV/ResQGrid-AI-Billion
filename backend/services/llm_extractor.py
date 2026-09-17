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
from backend.services.location_resolver import LocationResolver, INDIAN_DISTRICT_GAZETTEER


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
        "flood": ["flood", "flooding", "waterlogging", "inundated", "submerged", "river overflow", "breach", "water level", "rainfall", "downpour", "rising water"],
        "cyclone": ["cyclone", "hurricane", "typhoon", "high wind", "storm surge", "gale", "storm"],
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
        location_raw = None
        # Check known gazetteer disaster zones directly in text
        for key, loc_data in INDIAN_DISTRICT_GAZETTEER.items():
            if key in text_lower:
                location_raw = loc_data["name"]
                break

        if not location_raw:
            loc_patterns = [
                r"(?:in|at|near|around|village|ward|sector|district|colony|cluster)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Colony|Cluster|Ward|Village|District|Sector|Nagar|Pur|Ganj|Bazaar|Camp|Relief Center)))\s*(?:levee|breach|has|is|reported|facing|residents|waters|flooded)?",
                r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:has|is|reported|facing|residents|levee|breached)"
            ]
            stopwords = ["residents", "hospital", "warehouse", "bridge", "road", "water", "food", "high", "urgent", "situation", "severe", "citizens", "people", "patients"]
            for pat in loc_patterns:
                match = re.search(pat, text)
                if match:
                    candidate_loc = match.group(1).strip()
                    if candidate_loc.lower() not in stopwords:
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

        critical_kws = [
            "urgent medical", "critical patient", "emergency medical", "icu",
            "dialysis", "oxygen", "cardiac", "ventilator", "trauma", "life support",
            "chemotherapy", "blood transfusion", "infant in distress"
        ]
        high_kws = [
            "medical", "injured", "doctor", "transfer", "ambulance", "first aid",
            "casualties", "wound", "fracture", "hypothermia", "pregnant"
        ]

        if any(kw in text_lower for kw in critical_kws):
            med_priority = "CRITICAL"
            field_conf["medical_needs"] = 0.95
            med_exp = "Urgent / life-critical medical emergency (dialysis, trauma, ICU, or oxygen) declared."
        elif any(kw in text_lower for kw in high_kws):
            med_priority = "HIGH"
            field_conf["medical_needs"] = 0.85
            med_exp = "Medical attention, patient transfer, or injuries reported."
        else:
            med_priority = "NORMAL"
            field_conf["medical_needs"] = 0.50
            med_exp = "No specialized medical emergency declared."

        pat_patterns = [
            r"(\d+)\s*(?:elderly|patients|injured|victims|casualties|residents|citizens)?\s*(?:require|need|awaiting)?\s*(?:dialysis|oxygen|urgent medical|medical|icu|transfer)",
            r"(\d+)\s*(?:patients|elderly|injured|victims|casualties)",
        ]
        for pat in pat_patterns:
            pat_match = re.search(pat, text_lower)
            if pat_match:
                try:
                    patients = int(pat_match.group(1))
                    break
                except ValueError:
                    pass

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

        ROAD_STATUS_WORDS = {
            "impassable", "blocked", "submerged", "flooded", "closed",
            "damaged", "destroyed", "washed", "breached", "down", "waterlogged"
        }

        if any(kw in text_lower for kw in ["blocked", "submerged", "causeway washed", "bridge down", "impassable", "breached", "washed away", "cut off"]):
            road_status = "BLOCKED"
            road_exp = "Road, bridge, or causeway reported impassable or submerged."
            field_conf["road_conditions"] = 0.92

            # 1. Descriptive roads like "north access road", "coastal causeway", "east bridge"
            desc_roads = re.findall(
                r"\b((?:north|south|east|west|central|coastal|main|river|access)\s+(?:access\s+)?(?:road|route|bridge|causeway|highway|expressway))\b",
                text_lower
            )
            for dr in desc_roads:
                seg_id = "ROAD-" + "-".join(dr.upper().split())
                if seg_id not in blocked_segments:
                    blocked_segments.append(seg_id)

            # 2. Identifier roads like "Road R17", "NH-37", "Bridge B4"
            code_roads = re.findall(r"(?:road|route|bridge|causeway|nh|highway)\s*([a-z0-9\-]+)", text_lower)
            for cr in code_roads:
                cr_clean = cr.strip().lower()
                if cr_clean not in ROAD_STATUS_WORDS and len(cr_clean) >= 2:
                    seg_id = f"ROAD-{cr_clean.upper()}"
                    if seg_id not in blocked_segments:
                        blocked_segments.append(seg_id)

        elif "open" in text_lower or "clear" in text_lower or "passable" in text_lower:
            road_status = "OPEN"
            road_exp = "Road network confirmed clear and navigable."
            field_conf["road_conditions"] = 0.85
        else:
            road_status = "UNKNOWN"
            road_exp = "Road status not provided in source report."
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
        text = input_data.text or input_data.raw_text or ""
        source = input_data.source_reference or input_data.source or "FIELD-DISPATCH"
        return provider.extract(text, source)
