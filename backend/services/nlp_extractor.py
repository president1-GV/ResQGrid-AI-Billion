import re
from typing import Dict, Any, Optional
from ..models.schemas import FieldReport

class NLPExtractor:
    """
    Open-source transparent NLP & Information Extraction pipeline
    for unstructured disaster field reports.
    Extracts population figures, stranded casualties, medical/food/water requests,
    location references, and urgency tiers.
    """

    def extract(self, text: str, location_hint: Optional[str] = None) -> Dict[str, Any]:
        text_lower = text.lower()

        # 1. Population extraction (e.g., "300 stranded", "120 elderly", "500 people")
        pop = None
        pop_matches = re.findall(r'(\d+[\d,]*)\s*(?:people|persons|stranded|residents|families|evacuees|victims|villagers|patients|elderly)', text_lower)
        if pop_matches:
            try:
                pop = int(pop_matches[0].replace(',', ''))
            except ValueError:
                pop = 150
        elif re.search(r'\bseveral hundred\b', text_lower):
            pop = 300
        elif re.search(r'\bdozens\b', text_lower):
            pop = 50

        # 2. Need extraction
        needs = {}

        # Water
        water_match = re.findall(r'(\d+[\d,]*)\s*(?:liters|litres|l|pouches|bottles)\s*(?:of\s*)?(?:water|drinking water)', text_lower)
        if water_match:
            needs["water"] = int(water_match[0].replace(',', ''))
        elif "water" in text_lower or "drinking water" in text_lower or "thirst" in text_lower:
            needs["water"] = (pop * 3) if pop else 1000

        # Food
        food_match = re.findall(r'(\d+[\d,]*)\s*(?:packets|rations|meals|food packets)', text_lower)
        if food_match:
            needs["food"] = int(food_match[0].replace(',', ''))
        elif "food" in text_lower or "starving" in text_lower or "hunger" in text_lower or "rations" in text_lower:
            needs["food"] = (pop * 1) if pop else 400

        # Medical
        med_match = re.findall(r'(\d+[\d,]*)\s*(?:medical kits|kits|iv bags|ors|medicines)', text_lower)
        if med_match:
            needs["medical_kits"] = int(med_match[0].replace(',', ''))
        elif any(k in text_lower for k in ["medical", "clinic", "injured", "diarrhea", "insulin", "casualt", "wound", "trauma"]):
            needs["medical_kits"] = max(10, int(pop * 0.1)) if pop else 30

        # Ambulances & Teams
        if "ambulance" in text_lower or "critical patient" in text_lower or "trauma" in text_lower:
            amb_match = re.findall(r'(\d+)\s*ambulance', text_lower)
            needs["ambulances"] = int(amb_match[0]) if amb_match else 2

        if "doctor" in text_lower or "paramedic" in text_lower or "medical team" in text_lower:
            needs["medical_teams"] = 2

        # 3. Urgency detection
        urgency = "Medium"
        if any(w in text_lower for w in ["critical", "emergency", "urgent", "immediate", "dying", "perishing", "breached", "submerged", "drowning"]):
            urgency = "Critical"
        elif any(w in text_lower for w in ["high", "severe", "running out", "exhausted", "rising fast"]):
            urgency = "High"

        # 4. Confidence & Reliability
        confidence = 0.85
        if pop is not None and needs:
            confidence = 0.94
        elif pop is None and not needs:
            confidence = 0.60

        tier = "HIGH CONFIDENCE"
        if confidence < 0.70:
            tier = "LOW CONFIDENCE"
        elif confidence < 0.85:
            tier = "MEDIUM CONFIDENCE"

        # Check for conflicts / vague claims
        if "rumor" in text_lower or "unverified" in text_lower:
            tier = "CONFLICTING"
            confidence = 0.45

        return {
            "extracted_population": pop or (pop_matches[0] if pop_matches else None),
            "extracted_needs": needs,
            "urgency": urgency,
            "confidence": confidence,
            "data_confidence_tier": tier,
            "location_extracted": location_hint or "Field Incident Sector"
        }

nlp_extractor = NLPExtractor()
