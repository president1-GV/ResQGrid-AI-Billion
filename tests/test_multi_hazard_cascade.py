"""
ResQGrid AI Billion - Common Core Multi-Hazard & Cascade Engine Test Suite
Automated verification of the 9-hazard registry, data truth classifications,
authoritative catalog manifests, and cascading disaster shock re-optimization.
"""

import unittest
import os
import yaml
from backend.services.multi_hazard_engine import (
    multi_hazard_engine,
    HazardType,
    TruthClass,
    MANDATORY_RESOURCE_DISCLAIMER
)
from backend.services.external_adapters import (
    USGSEarthquakeAdapter,
    NASAFIRMSAdapter,
    NOAAIBTrACSAdapter,
    NASAGPMIMERGAdapter,
    NASALandslideCatalogAdapter,
    NOAAStormEventsAdapter,
    UrbanFireIncidentAdapter,
    NCEITsunamiAdapter
)
from backend.services.dataset_service import DatasetService


class TestMultiHazardCascadeEngine(unittest.TestCase):

    def setUp(self):
        DatasetService.init_registry()

    def test_catalog_yaml_integrity(self):
        """Verifies data/catalog.yaml contains all 9 hazards, truth classes, and mandatory disclaimer."""
        cat_path = os.path.join("data", "catalog.yaml")
        self.assertTrue(os.path.exists(cat_path), "data/catalog.yaml must exist.")

        with open(cat_path, "r", encoding="utf-8") as f:
            cat = yaml.safe_load(f)

        self.assertIn("mandatory_disclaimer", cat)
        self.assertEqual(cat["mandatory_disclaimer"], MANDATORY_RESOURCE_DISCLAIMER)

        hazards = [h["code"] for h in cat.get("hazards_covered", [])]
        for expected in ["earthquake", "cyclone", "heavy_rainfall", "fire_incident",
                         "wildfire", "severe_storm", "landslide", "flood", "tsunami"]:
            self.assertIn(expected, hazards, f"Hazard '{expected}' must be covered in catalog.")

        datasets = cat.get("datasets", [])
        self.assertGreaterEqual(len(datasets), 10, "At least 10 datasets must be in catalog.")

        # Verify operational inventory has SYNTHETIC truth class
        inv_ds = next((d for d in datasets if d.get("dataset_id") == "operational_resource_inventory"), None)
        self.assertIsNotNone(inv_ds)
        self.assertEqual(inv_ds.get("truth_class"), "SYNTHETIC")

    def test_all_hazards_summary(self):
        """Verifies multi_hazard_engine summary covers all 9 hazards."""
        summary = multi_hazard_engine.get_all_hazards_summary()
        self.assertEqual(summary.get("total_hazards"), 9)
        self.assertEqual(summary.get("status"), "ONLINE")
        self.assertEqual(summary.get("mandatory_disclaimer"), MANDATORY_RESOURCE_DISCLAIMER)

        types = [h["hazard_type"] for h in summary.get("hazards", [])]
        self.assertIn("earthquake", types)
        self.assertIn("cyclone", types)
        self.assertIn("tsunami", types)
        self.assertIn("wildfire", types)
        self.assertIn("landslide", types)

    def test_earthquake_adapter(self):
        """Verifies USGS Earthquake adapter returns valid magnitude and coordinates."""
        res = USGSEarthquakeAdapter.get_earthquakes(live=False)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreaterEqual(len(res["events"]), 1)
        ev = res["events"][0]
        self.assertIn("magnitude", ev)
        self.assertIn("latitude", ev)
        self.assertIn("longitude", ev)
        self.assertIn("depth_km", ev)
        self.assertGreater(ev["magnitude"], 0.0)

    def test_firms_wildfire_adapter(self):
        """Verifies NASA FIRMS active fire adapter returns brightness and FRP."""
        res = NASAFIRMSAdapter.get_active_fires()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreaterEqual(len(res["fires"]), 1)
        fire = res["fires"][0]
        self.assertIn("brightness_k", fire)
        self.assertIn("frp_mw", fire)
        self.assertEqual(fire["truth_class"], "NEAR_REAL_TIME")

    def test_ibtracs_cyclone_adapter(self):
        """Verifies NOAA IBTrACS cyclone adapter returns storm tracks and central pressure."""
        res = NOAAIBTrACSAdapter.get_cyclones()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreaterEqual(len(res["cyclones"]), 1)
        cyc = res["cyclones"][0]
        self.assertIn("max_wind_knots", cyc)
        self.assertIn("track_points", cyc)
        self.assertGreater(len(cyc["track_points"]), 0)

    def test_gpm_imerg_rainfall_adapter(self):
        """Verifies NASA GPM IMERG telemetry returns accumulated rainfall and departure."""
        res = NASAGPMIMERGAdapter.get_precipitation_telemetry()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreaterEqual(len(res["monitored_sectors"]), 1)
        sec = res["monitored_sectors"][0]
        self.assertIn("accumulated_24h_mm", sec)
        self.assertIn("departure_percent", sec)

    def test_landslide_adapter(self):
        """Verifies NASA GLC landslide adapter returns triggers and road blockage links."""
        res = NASALandslideCatalogAdapter.get_landslides()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreaterEqual(len(res["records"]), 1)
        ls = res["records"][0]
        self.assertIn("trigger", ls)
        self.assertIn("landslide_size", ls)

    def test_urban_fire_adapter(self):
        """Verifies NFIRS fire adapter returns synthetic incident with disclaimer."""
        res = UrbanFireIncidentAdapter.get_incidents()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["truth_class"], "SYNTHETIC")
        self.assertEqual(res["disclaimer"], MANDATORY_RESOURCE_DISCLAIMER)

    def test_earthquake_tsunami_cascade_simulation(self):
        """Verifies cascading Earthquake -> Tsunami shock severs roads and re-optimizes with OR-Tools."""
        res = multi_hazard_engine.simulate_cascade({
            "cascade_type": "EARTHQUAKE_TSUNAMI",
            "severity_multiplier": 1.5
        })
        self.assertEqual(res.truth_class, TruthClass.SIMULATION)
        self.assertEqual(res.total_steps, 3)
        self.assertIn("ROAD-R17", res.severed_roads)
        self.assertGreater(res.reallocated_dispatches_count, 0)
        self.assertEqual(res.disclaimer, MANDATORY_RESOURCE_DISCLAIMER)

    def test_cyclone_flood_landslide_cascade_simulation(self):
        """Verifies compound Cyclone -> Flood -> Landslide cascade shock execution."""
        res = multi_hazard_engine.simulate_cascade({
            "cascade_type": "CYCLONE_FLOOD_LANDSLIDE",
            "severity_multiplier": 1.6
        })
        self.assertEqual(res.total_steps, 3)
        self.assertIn("ROAD-R12", res.severed_roads)
        self.assertGreater(res.reallocated_dispatches_count, 0)

    def test_provenance_registry(self):
        """Verifies cryptographic SHA-256 provenance registration and retrieval."""
        prov = multi_hazard_engine.get_provenance("usgs_eq_001")
        self.assertIsNotNone(prov)
        self.assertEqual(prov.record_id, "usgs_eq_001")
        self.assertEqual(len(prov.hash_sha256), 64)
        self.assertEqual(prov.verification_method, "SHA256_INTEGRITY_CHECK")


if __name__ == "__main__":
    unittest.main()
