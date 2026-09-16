"""
ResQGrid AI Billion - Dataset Intelligence & LLM Schemas
Strict Pydantic schemas for datasets, validation, quality metrics, LLM extraction, and model training.
"""

from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field


class DatasetSourceType(str, Enum):
    PUBLIC_OPEN_DATA = "PUBLIC OPEN DATA"
    AUTHORIZED_API = "AUTHORIZED API"
    SYNTHETIC_MOCK = "SYNTHETIC / DEMO DATA"
    USER_PROVIDED = "USER-PROVIDED"


class IngestionStatus(str, Enum):
    IDLE = "IDLE"
    INGESTING = "INGESTING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    STALE = "STALE"


class ValidationStatus(str, Enum):
    PENDING = "PENDING"
    VALIDATED = "VALIDATED"
    FLAGGED = "FLAGGED"
    FAILED = "FAILED"


class DatasetMetadata(BaseModel):
    dataset_id: str
    name: str
    provider: str
    description: str
    source_url: str
    license_type: str
    format: str
    update_frequency: str
    geographic_scope: str
    temporal_scope: str
    record_count: int = 0
    file_size_bytes: int = 0
    last_ingested: Optional[str] = None
    ingestion_status: IngestionStatus = IngestionStatus.IDLE
    validation_status: ValidationStatus = ValidationStatus.PENDING
    quality_score: float = 0.0
    is_synthetic: bool = False
    schema_fields: List[Dict[str, str]] = []
    local_path: Optional[str] = None


class DataQualityReport(BaseModel):
    dataset_id: str
    timestamp: str
    record_count: int
    completeness_pct: float
    uniqueness_pct: float
    validity_pct: float
    consistency_pct: float
    timeliness_hours: float
    geospatial_validity_pct: float
    overall_quality_score: float
    issues: List[str] = []


class IngestionRun(BaseModel):
    run_id: str
    dataset_id: str
    started_at: str
    completed_at: Optional[str] = None
    status: IngestionStatus
    records_ingested: int = 0
    bytes_downloaded: int = 0
    error_message: Optional[str] = None
    quality_report: Optional[DataQualityReport] = None


class LLMExtractionInput(BaseModel):
    text: str
    source_reference: Optional[str] = "FIELD-DISPATCH"
    timestamp: Optional[str] = None
    provider: Optional[str] = "local"  # "local", "gemini", "huggingface", "mock"


class LocationCandidate(BaseModel):
    name: str
    latitude: float
    longitude: float
    district: str
    state: str
    confidence: float
    source: str


class LLMExtractedLocation(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    state: Optional[str] = None
    resolution_confidence: float = 0.0
    is_ambiguous: bool = False
    candidate_matches: List[LocationCandidate] = []
    source: str = "Unresolved"


class LLMExtractedMedical(BaseModel):
    priority: Optional[str] = None
    patients: Optional[int] = None
    critical_injuries: Optional[int] = None
    explanation: Optional[str] = None


class LLMExtractedRoad(BaseModel):
    status: Optional[str] = None
    blocked_segments: List[str] = []
    explanation: Optional[str] = None


class LLMExtractionOutput(BaseModel):
    extraction_id: str
    event_type: Optional[str] = None
    location: LLMExtractedLocation
    affected_population: Optional[int] = None
    severity: Optional[str] = None
    medical_needs: LLMExtractedMedical
    road_conditions: LLMExtractedRoad
    resource_demands: Dict[str, Optional[float]] = {}
    confidence: float
    field_confidence: Dict[str, float] = {}
    missing_fields: List[str] = []
    hallucination_warnings: List[str] = []
    flag_for_review: bool = False
    source_reference: str
    timestamp: str
    review_status: str = "PENDING_REVIEW"
    reviewer_notes: Optional[str] = None


class HumanReviewAction(BaseModel):
    extraction_id: str
    action: str  # "APPROVE", "MODIFY", "REJECT"
    modified_data: Optional[Dict[str, Any]] = None
    reviewer_role: str = "Incident Commander"
    rationale: Optional[str] = None


class ModelTrainingRequest(BaseModel):
    model_type: str = "demand_gradient_boosting"
    dataset_id: str = "india_flood_inventory"
    test_split: float = 0.2
    n_estimators: int = 100
    learning_rate: float = 0.1


class ModelTrainingResponse(BaseModel):
    model_name: str
    model_version: str
    model_type: str
    status: str
    trained_at: str
    records_used: int
    train_split: int
    test_split: int
    r2_score: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    feature_importances: Dict[str, float] = {}
    loss_history: List[float] = []
    artifact_path: str
