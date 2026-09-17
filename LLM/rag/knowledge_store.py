"""
ResQGrid AI - Disaster SOP & Guidelines Knowledge Base (Local RAG)
Provides cited, deterministic retrieval over humanitarian standards and NDRF SOPs.
"""

import math
import re
from typing import List, Dict, Any, Optional


DISASTER_SOPS = [
    {
        "doc_id": "SOP-SPHERE-01",
        "title": "Sphere Handbook Humanitarian Standards — Water Supply",
        "source": "Sphere Project (2018 Edition) Chapter 6",
        "category": "Water & Sanitation",
        "content": "Minimum water requirement is 15 litres per person per day for drinking, cooking, and personal hygiene. In acute flood emergencies, an immediate survival allocation of 7.5 litres per person per day must be dispatched within the first 24 hours. Water points must be located within 500 metres of temporary shelters.",
        "thresholds": {"min_liters_per_day": 15, "survival_liters_first_24h": 7.5, "max_distance_meters": 500}
    },
    {
        "doc_id": "SOP-SPHERE-02",
        "title": "Sphere Handbook — Food Security and Nutrition",
        "source": "Sphere Project (2018 Edition) Chapter 7",
        "category": "Food Security",
        "content": "Emergency initial food intake must provide at least 2,100 kcal per person per day with adequate protein and micronutrient balance. Ready-to-eat ration packs (dry rations, high-energy biscuits, ORS) should be prioritized during active inundation where cooking facilities are inaccessible.",
        "thresholds": {"min_daily_kcal": 2100, "ration_packs_per_person_day": 2}
    },
    {
        "doc_id": "SOP-NDRF-03",
        "title": "NDRF Flood Inundation & Rescue Protocol",
        "source": "National Disaster Response Force (NDRF) Standard Operating Procedures",
        "category": "Search & Rescue",
        "content": "Motorized Inflatable Rescue Boats (IRBs) must be dispatched whenever water depth exceeds 1.2 metres or road accessibility is impassable for high-axle vehicles. Priority rescue order: 1) Medical emergencies and unattended infants, 2) Elderly and mobility-impaired persons, 3) General stranded population.",
        "thresholds": {"boat_dispatch_depth_m": 1.2, "triage_levels": 3}
    },
    {
        "doc_id": "SOP-HEALTH-04",
        "title": "Epidemic Prevention & Primary Medical Triage",
        "source": "Integrated Disease Surveillance Programme (IDSP) / WHO Flood Guidance",
        "category": "Medical & Health",
        "content": "Post-inundation acute gastroenteritis and leptospirosis require immediate deployment of chlorine water purification tablets, ORS, IV fluids, and doxycycline prophylaxis. One Emergency Health Kit (IEHK basic) serves 1,000 persons for approximately 3 months.",
        "thresholds": {"kit_to_population_ratio": 0.001, "ors_per_pediatric_case": 3}
    },
    {
        "doc_id": "SOP-LOGISTICS-05",
        "title": "Emergency Buffer Inventory & Vehicle Dispatch Safety",
        "source": "Humanitarian Supply Chain Guidelines",
        "category": "Logistics & Fleet",
        "content": "Central supply staging depots must maintain a mandatory 15% safety buffer of total forecasted regional demand. Convoys must not cross flooded causeways if current speed exceeds 1.5 m/s or water level is above axle depth (0.45m for heavy trucks). Alternative routing must be recomputed immediately.",
        "thresholds": {"safety_buffer_pct": 15, "max_water_depth_truck_m": 0.45, "max_current_speed_ms": 1.5}
    }
]


class DisasterKnowledgeStore:
    """Local, offline vector-free TF-IDF similarity knowledge retrieval engine."""

    def __init__(self, sops: Optional[List[Dict[str, Any]]] = None):
        self.documents = sops or DISASTER_SOPS
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\b\w{3,}\b", text.lower())

    def _build_index(self):
        self.doc_tokens = [self._tokenize(doc["title"] + " " + doc["content"]) for doc in self.documents]
        self.vocab = sorted(list(set(token for tokens in self.doc_tokens for token in tokens)))
        self.idf = {}
        n_docs = len(self.documents)
        for term in self.vocab:
            df = sum(1 for tokens in self.doc_tokens if term in tokens)
            self.idf[term] = math.log((n_docs + 1) / (df + 1)) + 1.0

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.documents[:top_k]

        scores = []
        for idx, doc in enumerate(self.documents):
            score = 0.0
            doc_token_counts = {}
            for t in self.doc_tokens[idx]:
                doc_token_counts[t] = doc_token_counts.get(t, 0) + 1

            for qt in query_tokens:
                tf = doc_token_counts.get(qt, 0)
                if tf > 0:
                    score += tf * self.idf.get(qt, 1.0)

            # Boost exact title match
            for qt in query_tokens:
                if qt in doc["title"].lower():
                    score += 3.0

            scores.append((idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for doc_idx, score in scores[:top_k]:
            if score > 0 or len(results) == 0:
                doc = dict(self.documents[doc_idx])
                doc["relevance_score"] = round(score, 3)
                results.append(doc)
        return results

    def query_with_citation(self, query: str) -> Dict[str, Any]:
        """Returns structured answer with cited standards and actionable thresholds."""
        matched = self.search(query, top_k=2)
        if not matched:
            return {
                "query": query,
                "answer": "No specific disaster management SOP matched the requested criteria.",
                "citations": []
            }

        top_doc = matched[0]
        citations = [{"doc_id": d["doc_id"], "title": d["title"], "source": d["source"]} for d in matched]

        return {
            "query": query,
            "top_match": top_doc["title"],
            "guideline": top_doc["content"],
            "answer": top_doc["content"],
            "thresholds": top_doc.get("thresholds", {}),
            "citations": citations,
            "provenance": "Official Sphere / NDRF Standard Operating Procedures"
        }
