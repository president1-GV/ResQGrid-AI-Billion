from typing import Dict, List, Any
from datetime import datetime
from ..models.schemas import (
    DisasterEvent, AffectedZone, Warehouse, Hospital, Shelter, Road, RoadStatus
)

def get_initial_disaster_event() -> DisasterEvent:
    return DisasterEvent(
        id="EVT-FLOOD-2026-01",
        event_number="DISASTER-IND-FLD-094",
        type="Flood",
        severity="Critical",
        status="Active",
        start_time="2026-09-16T08:00:00Z",
        location="Brahmaputra-Kamrup Basin Sector",
        affected_population=45800,
        description="Flash flooding triggered by heavy monsoon precipitation (>245mm/24h) and river swell 2.8m above danger mark. Severe inundation across 7 municipal wards, road breaches, and trapped settlements requiring urgent supply allocation.",
        rainfall_mm=245.0,
        river_level_meters=14.8,
        danger_mark_meters=12.0,
        created_at="2026-09-16T08:00:00Z",
        updated_at="2026-09-16T13:30:00Z"
    )

def get_initial_zones() -> List[AffectedZone]:
    # Geographic center around Guwahati / Brahmaputra basin (26.18, 91.75)
    return [
        AffectedZone(
            id="zone_1",
            event_id="EVT-FLOOD-2026-01",
            name="Riverbank Colony",
            population=8500,
            affected_population=7200,
            severity=0.95,
            vulnerability=0.88,
            medical_need=320,
            food_need=6500,
            water_need=14000,
            shelter_need=900,
            ambulances_need=6,
            medical_teams_need=4,
            lat=26.195,
            lon=91.732,
            road_accessibility=0.70,
            hospital_capacity=15,
            priority_score=94.5,
            is_critical=True,
            notes="Embankment breached. Water levels rising 5cm/hour. 120 elderly persons stranded in community hall."
        ),
        AffectedZone(
            id="zone_2",
            event_id="EVT-FLOOD-2026-01",
            name="Sector 4 Lowland",
            population=12000,
            affected_population=9500,
            severity=0.85,
            vulnerability=0.82,
            medical_need=410,
            food_need=8200,
            water_need=18000,
            shelter_need=1200,
            ambulances_need=5,
            medical_teams_need=3,
            lat=26.175,
            lon=91.720,
            road_accessibility=0.65,
            hospital_capacity=20,
            priority_score=88.2,
            is_critical=True,
            notes="Dense residential pocket with waterlogged ground floors. Power grid substation submerged."
        ),
        AffectedZone(
            id="zone_3",
            event_id="EVT-FLOOD-2026-01",
            name="North Bridge Enclave",
            population=6200,
            affected_population=4800,
            severity=0.78,
            vulnerability=0.75,
            medical_need=190,
            food_need=4200,
            water_need=9500,
            shelter_need=650,
            ambulances_need=4,
            medical_teams_need=2,
            lat=26.210,
            lon=91.758,
            road_accessibility=0.60,
            hospital_capacity=10,
            priority_score=81.0,
            is_critical=True,
            notes="Access road Road R17 is partially inundated. High current near causeway."
        ),
        AffectedZone(
            id="zone_4",
            event_id="EVT-FLOOD-2026-01",
            name="South Slum Cluster",
            population=15000,
            affected_population=11200,
            severity=0.92,
            vulnerability=0.96,
            medical_need=580,
            food_need=11000,
            water_need=24000,
            shelter_need=1800,
            ambulances_need=8,
            medical_teams_need=5,
            lat=26.148,
            lon=91.745,
            road_accessibility=0.55,
            hospital_capacity=8,
            priority_score=96.8,
            is_critical=True,
            notes="High population density, extreme poverty vulnerability. Contaminated drinking water sources, high diarrhea and waterborne outbreak alert."
        ),
        AffectedZone(
            id="zone_5",
            event_id="EVT-FLOOD-2026-01",
            name="Central Market Ward",
            population=9000,
            affected_population=4100,
            severity=0.60,
            vulnerability=0.50,
            medical_need=140,
            food_need=3200,
            water_need=7000,
            shelter_need=400,
            ambulances_need=2,
            medical_teams_need=2,
            lat=26.182,
            lon=91.765,
            road_accessibility=0.85,
            hospital_capacity=45,
            priority_score=62.4,
            is_critical=False,
            notes="Commercial spine. Roadways navigable by medium transport. Wholesale godowns evacuated."
        ),
        AffectedZone(
            id="zone_6",
            event_id="EVT-FLOOD-2026-01",
            name="Green Valley Ridge",
            population=5000,
            affected_population=1800,
            severity=0.38,
            vulnerability=0.40,
            medical_need=80,
            food_need=1500,
            water_need=3500,
            shelter_need=200,
            ambulances_need=1,
            medical_teams_need=1,
            lat=26.160,
            lon=91.800,
            road_accessibility=0.95,
            hospital_capacity=60,
            priority_score=44.1,
            is_critical=False,
            notes="Elevated topography acting as spontaneous gathering point for evacuees."
        ),
        AffectedZone(
            id="zone_7",
            event_id="EVT-FLOOD-2026-01",
            name="Old Town Heritage Ward",
            population=11000,
            affected_population=7200,
            severity=0.82,
            vulnerability=0.79,
            medical_need=290,
            food_need=6000,
            water_need=13000,
            shelter_need=850,
            ambulances_need=4,
            medical_teams_need=3,
            lat=26.190,
            lon=91.785,
            road_accessibility=0.60,
            hospital_capacity=25,
            priority_score=83.6,
            is_critical=True,
            notes="Dense historic alleys with high silt and debris buildup. Heavy vehicle access barred; small boat and drone recon needed."
        )
    ]

def get_initial_warehouses() -> List[Warehouse]:
    return [
        Warehouse(
            id="WH-NORTH",
            name="North Apex Logistics Hub",
            location="NH-27 Industrial Corridor, Jalukbari",
            lat=26.220,
            lon=91.700,
            capacity=120000,
            operational_status="Operational",
            inventory={
                "water": 45000,          # Liters
                "food": 25000,           # Packets
                "medical_kits": 800,     # Kits
                "ambulances": 10,        # Vehicles
                "medical_teams": 8,      # Teams
                "shelter_kits": 2500,    # Kits
                "trucks": 18,
                "drones": 6
            },
            vehicles_available={
                "heavy_truck": 12,
                "medium_truck": 6,
                "all_terrain_ambulance": 8,
                "speed_rescue_boat": 5,
                "delivery_drone": 6
            },
            personnel_available={
                "doctors": 18,
                "paramedics": 32,
                "rescue_operators": 45,
                "drivers": 24
            }
        ),
        Warehouse(
            id="WH-EAST",
            name="East Strategic Medical Depot",
            location="Six Mile Healthcare Complex",
            lat=26.135,
            lon=91.810,
            capacity=75000,
            operational_status="Operational",
            inventory={
                "water": 28000,
                "food": 16000,
                "medical_kits": 1200,
                "ambulances": 14,
                "medical_teams": 10,
                "shelter_kits": 1800,
                "trucks": 10,
                "drones": 4
            },
            vehicles_available={
                "heavy_truck": 6,
                "medium_truck": 8,
                "all_terrain_ambulance": 12,
                "speed_rescue_boat": 4,
                "delivery_drone": 4
            },
            personnel_available={
                "doctors": 26,
                "paramedics": 40,
                "rescue_operators": 30,
                "drivers": 18
            }
        ),
        Warehouse(
            id="WH-SOUTH",
            name="South Municipal Emergency Reserve",
            location="Beltola Highway Interchange",
            lat=26.120,
            lon=91.760,
            capacity=85000,
            operational_status="Operational",
            inventory={
                "water": 35000,
                "food": 22000,
                "medical_kits": 650,
                "ambulances": 6,
                "medical_teams": 5,
                "shelter_kits": 2000,
                "trucks": 12,
                "drones": 3
            },
            vehicles_available={
                "heavy_truck": 8,
                "medium_truck": 7,
                "all_terrain_ambulance": 5,
                "speed_rescue_boat": 3,
                "delivery_drone": 3
            },
            personnel_available={
                "doctors": 12,
                "paramedics": 22,
                "rescue_operators": 35,
                "drivers": 16
            }
        )
    ]

def get_initial_hospitals() -> List[Hospital]:
    return [
        Hospital(
            id="HOSP-1",
            name="Apex State Medical College & Trauma Center",
            lat=26.155,
            lon=91.770,
            total_beds=500,
            available_beds=68,
            icu_available=14,
            status="Operational"
        ),
        Hospital(
            id="HOSP-2",
            name="Civil District General Hospital",
            lat=26.185,
            lon=91.750,
            total_beds=320,
            available_beds=22,
            icu_available=3,
            status="Critical Capacity"
        ),
        Hospital(
            id="HOSP-3",
            name="North Military Cantonment Emergency Base",
            lat=26.215,
            lon=91.740,
            total_beds=200,
            available_beds=92,
            icu_available=18,
            status="Operational"
        )
    ]

def get_initial_shelters() -> List[Shelter]:
    return [
        Shelter(
            id="SHELTER-1",
            name="Central Polytechnic Evacuation Campus",
            lat=26.168,
            lon=91.762,
            capacity=3500,
            current_occupancy=2400,
            available_capacity=1100,
            status="Operational"
        ),
        Shelter(
            id="SHELTER-2",
            name="Indoor Sports Stadium Complex",
            lat=26.178,
            lon=91.742,
            capacity=5000,
            current_occupancy=3900,
            available_capacity=1100,
            status="Operational"
        ),
        Shelter(
            id="SHELTER-3",
            name="Highland Community High School",
            lat=26.142,
            lon=91.795,
            capacity=1800,
            current_occupancy=1720,
            available_capacity=80,
            status="Near Saturation"
        )
    ]

def get_initial_roads() -> List[Road]:
    return [
        Road(
            id="ROAD-R1",
            name="NH-27 Western Corridor",
            from_node="WH-NORTH",
            to_node="zone_1",
            distance_km=4.8,
            standard_travel_min=10.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=5.0,
            speed_multiplier=0.9
        ),
        Road(
            id="ROAD-R2",
            name="Jalukbari Bypass",
            from_node="WH-NORTH",
            to_node="zone_2",
            distance_km=6.2,
            standard_travel_min=14.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=8.0,
            speed_multiplier=0.85
        ),
        Road(
            id="ROAD-R17",
            name="North Bridge Causeway",
            from_node="WH-NORTH",
            to_node="zone_3",
            distance_km=5.5,
            standard_travel_min=12.0,
            status=RoadStatus.OPEN, # Can be toggled to BLOCKED in the simulation!
            flood_depth_cm=18.0,
            speed_multiplier=0.6
        ),
        Road(
            id="ROAD-R4",
            name="East Ring Expressway",
            from_node="WH-EAST",
            to_node="zone_3",
            distance_km=9.8,
            standard_travel_min=19.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=0.0,
            speed_multiplier=1.0
        ),
        Road(
            id="ROAD-R5",
            name="Six Mile - Slum Sector Arterial",
            from_node="WH-EAST",
            to_node="zone_4",
            distance_km=7.5,
            standard_travel_min=16.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=10.0,
            speed_multiplier=0.75
        ),
        Road(
            id="ROAD-R6",
            name="Central Market Transit Link",
            from_node="WH-EAST",
            to_node="zone_5",
            distance_km=6.0,
            standard_travel_min=11.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=0.0,
            speed_multiplier=1.0
        ),
        Road(
            id="ROAD-R7",
            name="Beltola - South Slum Direct Access",
            from_node="WH-SOUTH",
            to_node="zone_4",
            distance_km=4.2,
            standard_travel_min=9.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=12.0,
            speed_multiplier=0.7
        ),
        Road(
            id="ROAD-R8",
            name="South Urban Trunkway",
            from_node="WH-SOUTH",
            to_node="zone_2",
            distance_km=8.1,
            standard_travel_min=17.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=5.0,
            speed_multiplier=0.9
        ),
        Road(
            id="ROAD-R9",
            name="Heritage Sector Link",
            from_node="WH-EAST",
            to_node="zone_7",
            distance_km=7.1,
            standard_travel_min=15.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=15.0,
            speed_multiplier=0.65
        ),
        Road(
            id="ROAD-R10",
            name="Green Valley Connector",
            from_node="WH-SOUTH",
            to_node="zone_6",
            distance_km=5.9,
            standard_travel_min=12.0,
            status=RoadStatus.OPEN,
            flood_depth_cm=0.0,
            speed_multiplier=1.0
        )
    ]
