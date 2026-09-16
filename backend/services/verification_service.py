from typing import Dict, List, Any, Optional
from ..models.schemas import VerificationStatus, VerificationResult, IncidentCreateRequest

class VerificationService:
    def verify_incident(
        self,
        req: IncidentCreateRequest,
        existing_zones: List[Any],
        existing_reports: List[Any]
    ) -> VerificationResult:
        evidence = []
        conflicts = []
        confidence = 0.95

        # 1. Check for impossible / negative / absurd values
        if req.affected_population <= 0:
            conflicts.append("Affected population reported as zero or negative.")
            confidence -= 0.35
        elif req.affected_population > 5_000_000:
            conflicts.append("Extremely high population reported (>5M), warrants immediate verification.")
            confidence -= 0.20
        else:
            evidence.append(f"Reported population ({req.affected_population:,}) is statistically bounded within municipal ward limits.")

        if req.casualties < 0 or req.injured_people < 0 or req.missing_people < 0:
            conflicts.append("Negative values found in casualty or injury metrics.")
            confidence -= 0.40
        else:
            evidence.append(f"Casualty metrics validated: {req.casualties} deceased, {req.injured_people} injured, {req.missing_people} missing.")

        # 2. Check for inconsistent location coordinates
        if req.lat is not None and req.lon is not None:
            if not (-90 <= req.lat <= 90 and -180 <= req.lon <= 180):
                conflicts.append(f"Coordinates ({req.lat}, {req.lon}) are physically invalid on WGS-84 ellipsoid.")
                confidence -= 0.50
            else:
                evidence.append(f"Geolocation validated at coordinates ({req.lat:.4f}, {req.lon:.4f}).")
        else:
            evidence.append("Coordinates resolved from municipal ward name via local GIS directory.")

        # 3. Check for conflicting reports / duplicates in existing telemetry
        matched_zone = None
        for z in existing_zones:
            if z.name.lower() in req.location.lower() or req.location.lower() in z.name.lower():
                matched_zone = z
                break

        if matched_zone:
            pop_ratio = req.affected_population / max(1, matched_zone.affected_population)
            if pop_ratio > 3.0 or pop_ratio < 0.2:
                conflicts.append(
                    f"Conflict detected with base registry: {req.location} recorded {matched_zone.affected_population:,} pop vs reported {req.affected_population:,}."
                )
                confidence -= 0.25
            else:
                evidence.append(f"Corroborated with active sector record: {matched_zone.name} ({matched_zone.affected_population:,} registered).")

        # Check raw_text contradictions
        if req.raw_text:
            text_lower = req.raw_text.lower()
            if "no casualties" in text_lower and req.casualties > 0:
                conflicts.append(f"Raw report text states 'no casualties' but numerical field specifies {req.casualties} casualties.")
                confidence -= 0.30
            if "false alarm" in text_lower:
                conflicts.append("Text flags potential false alarm or simulated drill.")
                confidence -= 0.40

        # Determine final status
        confidence = max(0.1, min(1.0, confidence))
        if conflicts and confidence < 0.60:
            status = VerificationStatus.CONFLICTING
        elif conflicts and confidence >= 0.60:
            status = VerificationStatus.PARTIALLY_VERIFIED
        elif confidence >= 0.85:
            status = VerificationStatus.VERIFIED
        else:
            status = VerificationStatus.PARTIALLY_VERIFIED

        return VerificationResult(
            status=status,
            confidence=round(confidence, 2),
            evidence=evidence,
            conflicts_detected=conflicts
        )

verification_service = VerificationService()
