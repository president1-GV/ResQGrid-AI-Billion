from typing import List, Dict
from ..models.schemas import AffectedZone, PriorityScore

class PriorityEngine:
    def __init__(self,
                 w_severity: float = 0.28,
                 w_population: float = 0.20,
                 w_medical: float = 0.24,
                 w_vulnerability: float = 0.16,
                 w_accessibility: float = 0.12):
        self.w_severity = w_severity
        self.w_population = w_population
        self.w_medical = w_medical
        self.w_vulnerability = w_vulnerability
        self.w_accessibility = w_accessibility

    def calculate_zone_priority(self, zone: AffectedZone) -> PriorityScore:
        # Normalize population impact (cap at 15,000 for standard scale)
        norm_pop = min(1.0, zone.affected_population / 15000.0)
        # Normalize medical urgency (cap at 600)
        norm_med = min(1.0, zone.medical_need / 600.0)
        # Inverted accessibility (harder to reach -> higher urgency for early dispatch)
        access_urgency = 1.0 - max(0.0, min(1.0, zone.road_accessibility))

        raw_score = (
            self.w_severity * zone.severity +
            self.w_population * norm_pop +
            self.w_medical * norm_med +
            self.w_vulnerability * zone.vulnerability +
            self.w_accessibility * access_urgency
        )

        overall = round(raw_score * 100.0, 1)

        # Generate explainable factor bullet points
        explanations: List[str] = []
        if zone.severity >= 0.8:
            explanations.append(f"Critical flood severity rating ({int(zone.severity * 100)}%) with direct water ingress.")
        elif zone.severity >= 0.5:
            explanations.append(f"Moderate to high flood severity rating ({int(zone.severity * 100)}%).")

        if zone.vulnerability >= 0.8:
            explanations.append(f"High vulnerability index ({int(zone.vulnerability * 100)}%) indicating elevated elder, child, or unreinforced dwelling exposure.")

        if zone.medical_need >= 300:
            explanations.append(f"Acute medical demand ({zone.medical_need} critical patients) overwhelming local triage.")

        if zone.road_accessibility <= 0.6:
            explanations.append(f"Severely restricted road accessibility ({int(zone.road_accessibility * 100)}%) necessitating expedited rerouting before water levels rise.")

        if not explanations:
            explanations.append("Standard baseline response priority.")

        return PriorityScore(
            zone_id=zone.id,
            zone_name=zone.name,
            overall_score=overall,
            severity_weight=self.w_severity,
            population_weight=self.w_population,
            medical_weight=self.w_medical,
            vulnerability_weight=self.w_vulnerability,
            accessibility_weight=self.w_accessibility,
            time_weight=0.0,
            confidence=0.92,
            explanation=explanations
        )

    def compute_all_priorities(self, zones: List[AffectedZone]) -> Dict[str, PriorityScore]:
        scores = {}
        for z in zones:
            score_obj = self.calculate_zone_priority(z)
            scores[z.id] = score_obj
            # Update zone in place
            z.priority_score = score_obj.overall_score
            z.is_critical = score_obj.overall_score >= 80.0
        return scores

priority_engine = PriorityEngine()
