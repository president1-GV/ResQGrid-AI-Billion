"""
ResQGrid AI Billion - Dataset Intelligence & LLM Engine Test Suite
Automated verification of dataset ingestion, data quality engine,
LLM hallucination controls, location resolution, and ML demand training.
"""

import unittest
import os
from backend.services.dataset_service import DatasetService
from backend.services.data_quality_engine import DataQualityEngine
from backend.services.location_resolver import LocationResolver
from backend.services.llm_extractor import LLMExtractor
from backend.services.ml_demand_engine import MLDemandEngine
from backend.services.training_service import TrainingService
from backend.services.feature_store import FeatureStore
from backend.services.external_adapters import OpenMeteoLiveWeatherAdapter
from backend.models.dataset_schemas import (
    LLMExtractionInput,
    ModelTrainingRequest,
    HumanReviewAction
)


class TestDatasetIntelligence(unittest.TestCase):

    def setUp(self):
        DatasetService.init_registry()

    def test_dataset_catalog_registered(self):
        """Verifies all 7 national and global open disaster datasets are registered."""
        datasets = DatasetService.list_datasets()
        self.assertGreaterEqual(len(datasets), 7)
        ids = [d.dataset_id for d in datasets]
        self.assertIn("india_flood_inventory", ids)
        self.assertIn("emdat_india", ids)
        self.assertIn("imd_rainfall_daily", ids)
        self.assertIn("open_meteo_live", ids)
        self.assertIn("osm_nominatim_roads", ids)
        self.assertIn("isro_bhuvan_disaster", ids)
        self.assertIn("idrn_resource_network", ids)

    def test_data_quality_engine(self):
        """Verifies DataQualityEngine calculates real completeness, uniqueness, and validity."""
        test_records = [
            {"district": "Kamrup", "latitude": 26.14, "longitude": 91.73, "affected_population": 5000, "water": 15000},
            {"district": "Kamrup", "latitude": 26.14, "longitude": 91.73, "affected_population": 5000, "water": 15000},  # Duplicate
            {"district": "Cachar", "latitude": 24.83, "longitude": 92.77, "affected_population": 3200, "water": 9600},
            {"district": "Patna", "latitude": 25.59, "longitude": 85.13, "affected_population": 8000, "water": 24000},
        ]
        report = DataQualityEngine.evaluate("test_dataset", test_records)
        self.assertIsInstance(report.overall_quality_score, float)
        self.assertGreater(report.overall_quality_score, 0.0)
        self.assertLessEqual(report.overall_quality_score, 100.0)
        self.assertLess(report.uniqueness_pct, 100.0)  # Flagged duplicate
        self.assertTrue(any("duplicate" in iss.lower() for iss in report.issues))

    def test_location_resolver(self):
        """Verifies location resolution and Indian district gazetteer."""
        loc = LocationResolver.resolve("South Slum Cluster")
        self.assertIsNotNone(loc.name)
        self.assertIsNotNone(loc.latitude)
        self.assertIsNotNone(loc.longitude)
        self.assertEqual(loc.district, "Kamrup Metropolitan")
        self.assertGreaterEqual(loc.resolution_confidence, 0.90)

    def test_llm_extractor_structured(self):
        """Verifies extraction of critical disaster events from field dispatch text."""
        dispatch = (
            "Flash flood in South Slum Cluster! Around 1,200 people trapped on rooftops. "
            "14 elderly residents require urgent medical attention. Road R17 is completely submerged. "
            "Urgent need of 4,000 liters of water and 2 ambulances."
        )
        res = LLMExtractor.extract_event(LLMExtractionInput(text=dispatch))
        self.assertEqual(res.event_type, "flood")
        self.assertEqual(res.location.name, "South Slum Cluster")
        self.assertEqual(res.affected_population, 1200)
        self.assertEqual(res.medical_needs.priority, "CRITICAL")
        self.assertEqual(res.medical_needs.patients, 14)
        self.assertEqual(res.road_conditions.status, "BLOCKED")
        self.assertIn("ROAD-R17", res.road_conditions.blocked_segments)
        self.assertEqual(res.resource_demands.get("water"), 4000.0)
        self.assertEqual(res.resource_demands.get("ambulances"), 2.0)
        self.assertGreaterEqual(res.confidence, 0.85)

    def test_llm_extractor_hallucination_guard(self):
        """Verifies hallucination protection: absent fields MUST be null with warnings."""
        vague_text = "Unclear reports of storm damage somewhere in the region."
        res = LLMExtractor.extract_event(LLMExtractionInput(text=vague_text))
        self.assertIsNone(res.location.name)
        self.assertIsNone(res.location.latitude)
        self.assertIsNone(res.affected_population)
        self.assertTrue(res.flag_for_review)
        self.assertGreater(len(res.hallucination_warnings), 0)

    def test_ml_demand_engine_prediction(self):
        """Verifies ML demand prediction and Bayesian 90% confidence intervals."""
        res = MLDemandEngine.predict_demand(
            population=20000,
            vulnerability=0.75,
            rainfall_mm=180.0,
            flooded_area_sqkm=10.0
        )
        self.assertIn("predictions", res)
        self.assertIn("uncertainty", res)
        preds = res["predictions"]
        unc = res["uncertainty"]

        for comm in ["water", "food", "medical_kits", "shelter_kits", "ambulances"]:
            self.assertIn(comm, preds)
            self.assertGreater(preds[comm], 0.0)
            u = unc[comm]
            self.assertLessEqual(u["lower_bound"], u["estimate"])
            self.assertGreaterEqual(u["upper_bound"], u["estimate"])
            self.assertGreaterEqual(u["confidence"], 0.60)

    def test_training_service_demand_model(self):
        """Verifies model training pipeline, R2 evaluation, and artifact saving."""
        req = ModelTrainingRequest(dataset_id="india_flood_inventory", n_estimators=25)
        resp = TrainingService.train_demand_model(req)
        self.assertEqual(resp.status, "TRAINED_AND_DEPLOYED")
        self.assertGreaterEqual(resp.records_used, 500)
        self.assertGreaterEqual(resp.r2_score, 0.70)
        self.assertTrue(os.path.exists(resp.artifact_path))

    def test_feature_store_generation(self):
        """Verifies generation and retrieval of feature vectors."""
        fv = FeatureStore.generate_features_for_zone(
            zone_id="ZONE-TEST-01",
            population=15000,
            vulnerability=0.8,
            rainfall_mm=160.0,
            flooded_area_sqkm=5.0
        )
        self.assertEqual(fv["zone_id"], "ZONE-TEST-01")
        self.assertEqual(fv["population"], 15000)
        self.assertEqual(fv["feature_version"], "v1.2")
        stored = FeatureStore.get_features("ZONE-TEST-01")
        self.assertEqual(stored["zone_id"], "ZONE-TEST-01")

    def test_human_review_workflow(self):
        """Verifies human review actions on extracted field reports."""
        ext_dict = {
            "extraction_id": "EXT-TEST-001",
            "event_type": "flood",
            "review_status": "PENDING_REVIEW"
        }
        DatasetService.add_extraction(ext_dict)
        updated = DatasetService.update_extraction_review("EXT-TEST-001", "APPROVE", "Verified by Incident Commander")
        self.assertIsNotNone(updated)
        self.assertEqual(updated["review_status"], "APPROVED")

    def test_live_weather_adapter(self):
        """Verifies weather adapter output schema."""
        w = OpenMeteoLiveWeatherAdapter.get_live_weather(26.1445, 91.7362)
        self.assertIn("temperature_c", w)
        self.assertIn("relative_humidity_pct", w)
        self.assertIn("precipitation_mm", w)


if __name__ == "__main__":
    unittest.main()
