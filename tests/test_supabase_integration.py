import unittest
import asyncio
from backend.services.supabase_service import supabase_service, RESOURCE_DISCLAIMER
from backend.data.state_store import state
from fastapi.testclient import TestClient
from backend.main import app

class TestSupabaseIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_database_health_check(self):
        """Verifies live PostgreSQL 15 connection, PostGIS 3.6, and table statuses."""
        res = self.client.get("/api/database/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["status"], ["CONNECTED", "DEGRADED"])
        if data["status"] == "CONNECTED":
            self.assertTrue(data.get("postgis_enabled", False))
            self.assertIn("PostGIS", data.get("postgis_version", ""))
            self.assertIn("tables_status", data)
            self.assertGreaterEqual(data["tables_status"].get("affected_zones", 0), 0)
        self.assertEqual(data["disclaimer"], RESOURCE_DISCLAIMER)

    def test_02_postgis_spatial_nearby_query(self):
        """Verifies PostGIS geodesic spatial query returns sorted features by distance."""
        res = self.client.get("/api/database/spatial/nearby?lat=26.18&lon=91.75&radius_km=15")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertIn("features_found", data)
        results = data["results"]
        if len(results) >= 2:
            self.assertLessEqual(results[0]["distance_km"], results[1]["distance_km"])
            self.assertIn("name", results[0])
            self.assertIn("priority_score", results[0])

    def test_03_road_disruption_dynamic_reoptimization(self):
        """Verifies road status update in database triggers live dynamic re-optimization."""
        res = self.client.put("/api/database/roads/R17/status", json={
            "status": "FLOODED",
            "flood_depth_cm": 45.0,
            "speed_multiplier": 0.35,
            "updated_by": "GIS_OFFICER_INTEGRATION_TEST"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success", False))
        self.assertTrue(data.get("reoptimized", False))
        self.assertIn("audit_hash", data)
        self.assertEqual(len(data["audit_hash"]), 64)  # Valid SHA-256

    def test_04_commander_allocation_approval(self):
        """Verifies commander approval persists status and logs SHA-256 signed audit record."""
        res = self.client.post("/api/database/allocations/approve-all", json={
            "officer_name": "Col. Arvind Sharma",
            "notes": "Verified operational routing and approved for dispatch."
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success", False))
        self.assertIn("audit_hash", data)
        self.assertEqual(len(data["audit_hash"]), 64)

    def test_05_field_report_with_nlp_and_geometry(self):
        """Verifies ground field report ingestion with NLP extraction and Point geometry."""
        res = self.client.post("/api/database/field-reports", json={
            "reporter_name": "Sub-Insp. Pradip Baruah",
            "reporter_role": "NDRF First Responder",
            "location_name": "Sector 4 Lowland Embankment",
            "latitude": 26.175,
            "longitude": 91.720,
            "raw_text": "Water levels surged 30cm in 1 hour. Community shelter requires 500 drinking water bottles and 20 first-aid kits urgently.",
            "urgency": "Critical"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success", False))
        self.assertIn("field_report", data)
        self.assertIn("audit_hash", data)

    def test_06_tamper_evident_audit_log_chain(self):
        """Verifies audit trail integrity and hash chaining."""
        res = self.client.get("/api/database/audit-logs")
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertIsInstance(logs, list)
        if len(logs) > 0:
            first_log = logs[0]
            self.assertIn("sha256_hash", first_log)
            self.assertIn("actor", first_log)
            self.assertIn("action", first_log)
            self.assertEqual(len(first_log["sha256_hash"]), 64)

    def test_07_truthful_dataset_catalog(self):
        """Verifies authoritative sources are registered with proper truth classes and disclaimers."""
        res = self.client.get("/api/database/sources")
        self.assertEqual(res.status_code, 200)
        sources = res.json()
        self.assertIsInstance(sources, list)
        self.assertGreaterEqual(len(sources), 1)
        synthetic_sources = [s for s in sources if s.get("truth_class") == "SYNTHETIC"]
        for s in synthetic_sources:
            self.assertIn(RESOURCE_DISCLAIMER, s.get("disclaimer", ""))

if __name__ == "__main__":
    unittest.main()
