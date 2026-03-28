class SoilService:
    """
    Interprets Soil Health Card (SHC) data and gives fertilizer/amendment advice.
    Based on ICAR nutrient management guidelines for major Indian crops.
    """

    NUTRIENT_RANGES = {
        "nitrogen_kg_ha": {"low": 280, "medium": 560, "high": 999},
        "phosphorus_kg_ha": {"low": 10, "medium": 25, "high": 999},
        "potassium_kg_ha": {"low": 108, "medium": 280, "high": 999},
        "ph": {"acidic": 6.0, "neutral_low": 6.5, "neutral_high": 7.5, "alkaline": 8.5},
        "organic_carbon_percent": {"low": 0.5, "medium": 0.75, "high": 999},
    }

    FERTILIZER_DOSES_KG_HA = {
        "wheat": {"N": 120, "P": 60, "K": 40},
        "rice": {"N": 100, "P": 50, "K": 50},
        "soybean": {"N": 25, "P": 60, "K": 40},
        "gram": {"N": 20, "P": 40, "K": 20},
        "lentil": {"N": 20, "P": 40, "K": 20},
        "mustard": {"N": 80, "P": 40, "K": 40},
        "maize": {"N": 120, "P": 60, "K": 60},
        "sugarcane": {"N": 250, "P": 80, "K": 120},
        "tomato": {"N": 120, "P": 60, "K": 60},
    }

    def analyze(self, crop: str, nitrogen=None, phosphorus=None, potassium=None,
                ph=None, organic_carbon=None, soil_type="black") -> dict:
        recommendations = []
        deficiencies = []
        fertilizer_advice = []
        crop_lower = crop.lower()

        base_doses = self.FERTILIZER_DOSES_KG_HA.get(crop_lower, {"N": 80, "P": 40, "K": 40})

        if nitrogen is not None:
            ranges = self.NUTRIENT_RANGES["nitrogen_kg_ha"]
            if nitrogen < ranges["low"]:
                deficiencies.append("Nitrogen (N) — LOW")
                fertilizer_advice.append(
                    f"Apply {base_doses['N']} kg N/ha. "
                    f"Use Urea (46% N) — {round(base_doses['N'] / 0.46, 1)} kg/ha. "
                    f"Split: 50% basal + 50% at 30-35 DAS"
                )
            elif nitrogen < ranges["medium"]:
                fertilizer_advice.append(
                    f"Nitrogen is medium. Apply {round(base_doses['N'] * 0.75)} kg N/ha "
                    f"(75% of recommended dose)"
                )
            else:
                recommendations.append("Nitrogen is adequate. Skip extra N application to avoid lodging.")

        if phosphorus is not None:
            ranges = self.NUTRIENT_RANGES["phosphorus_kg_ha"]
            if phosphorus < ranges["low"]:
                deficiencies.append("Phosphorus (P) — LOW")
                fertilizer_advice.append(
                    f"Apply {base_doses['P']} kg P₂O₅/ha. "
                    f"Use DAP (18% N, 46% P) — {round(base_doses['P'] / 0.46, 1)} kg/ha as basal. "
                    f"Or Single Super Phosphate (SSP) — {round(base_doses['P'] / 0.16, 1)} kg/ha"
                )
            elif phosphorus < ranges["medium"]:
                fertilizer_advice.append(f"Phosphorus medium. Apply {round(base_doses['P'] * 0.5)} kg P₂O₅/ha")
            else:
                recommendations.append("Phosphorus is high. Skip P application this season.")

        if potassium is not None:
            ranges = self.NUTRIENT_RANGES["potassium_kg_ha"]
            if potassium < ranges["low"]:
                deficiencies.append("Potassium (K) — LOW")
                fertilizer_advice.append(
                    f"Apply {base_doses['K']} kg K₂O/ha. "
                    f"Use MOP (Muriate of Potash, 60% K) — {round(base_doses['K'] / 0.6, 1)} kg/ha as basal"
                )

        if ph is not None:
            if ph < self.NUTRIENT_RANGES["ph"]["acidic"]:
                recommendations.append(
                    f"pH {ph} is acidic. Apply agricultural lime (CaCO₃) — "
                    f"{round((6.5 - ph) * 1000)} kg/ha to raise pH to 6.5"
                )
                deficiencies.append("Soil pH — TOO ACIDIC")
            elif ph > self.NUTRIENT_RANGES["ph"]["alkaline"]:
                recommendations.append(
                    f"pH {ph} is alkaline. Apply gypsum (CaSO₄) — 500 kg/ha. "
                    "Also add organic matter (FYM) to improve structure."
                )
                deficiencies.append("Soil pH — TOO ALKALINE")
            else:
                recommendations.append(f"pH {ph} is ideal range (6.0-7.5) for {crop}.")

        if organic_carbon is not None:
            if organic_carbon < self.NUTRIENT_RANGES["organic_carbon_percent"]["low"]:
                recommendations.append(
                    f"Organic carbon {organic_carbon}% is very low. "
                    "Apply FYM (Farm Yard Manure) 5 tonnes/ha or compost 3 tonnes/ha before sowing. "
                    "Consider green manuring (Dhaincha/Sesbania) in summer."
                )
                deficiencies.append("Organic carbon — CRITICALLY LOW")

        return {
            "crop": crop,
            "soil_type": soil_type,
            "deficiencies": deficiencies,
            "fertilizer_recommendations": fertilizer_advice,
            "other_recommendations": recommendations,
            "nutrient_summary": {
                "nitrogen_status": self._classify(nitrogen, self.NUTRIENT_RANGES["nitrogen_kg_ha"]) if nitrogen else "not provided",
                "phosphorus_status": self._classify(phosphorus, self.NUTRIENT_RANGES["phosphorus_kg_ha"]) if phosphorus else "not provided",
                "potassium_status": self._classify(potassium, self.NUTRIENT_RANGES["potassium_kg_ha"]) if potassium else "not provided",
                "ph": ph,
                "organic_carbon": organic_carbon,
            },
            "source": "ICAR Nutrient Management Guidelines + Soil Health Card portal",
        }

    def _classify(self, value: float, ranges: dict) -> str:
        if value is None:
            return "not provided"
        if value < ranges["low"]:
            return "LOW"
        if value < ranges["medium"]:
            return "MEDIUM"
        return "HIGH"

    def get_crop_calendar(self, crop: str, region: str, season: str = "rabi") -> dict:
        calendars = {
            "wheat_rabi": {
                "sowing_window": "October 25 - November 25 (Rewa, MP)",
                "variety_suggestions": ["GW 322", "HI 8498 (durum)", "MP 3288", "JW 17"],
                "seed_rate_kg_per_acre": "40-45 kg",
                "spacing_cm": "20 cm row to row",
                "irrigation_schedule": [
                    "1st: Crown root initiation (21 DAS)",
                    "2nd: Tillering (45 DAS)",
                    "3rd: Jointing (65 DAS)",
                    "4th: Flowering (85 DAS)",
                    "5th: Grain filling (105 DAS)",
                    "6th: Dough stage (120 DAS)",
                ],
                "harvest_window": "March 15 - April 15",
                "days_to_maturity": 110,
            },
            "soybean_kharif": {
                "sowing_window": "June 20 - July 15 (Rewa, MP)",
                "variety_suggestions": ["JS 9305", "JS 9752", "NRC 7", "MACS 1407"],
                "seed_rate_kg_per_acre": "30-35 kg",
                "spacing_cm": "45 cm x 5 cm",
                "irrigation_schedule": ["At flowering (40 DAS)", "At pod fill (60 DAS)"],
                "harvest_window": "October 1 - November 15",
                "days_to_maturity": 95,
            },
            "gram_rabi": {
                "sowing_window": "October 15 - November 15 (Rewa, MP)",
                "variety_suggestions": ["JG 11", "JG 315", "JAKI 9218", "Phule G 5"],
                "seed_rate_kg_per_acre": "30-35 kg",
                "spacing_cm": "30 cm x 10 cm",
                "irrigation_schedule": ["At pre-flowering (35 DAS)", "At pod fill (65 DAS)"],
                "harvest_window": "February 20 - March 20",
                "days_to_maturity": 110,
            },
        }

        key = f"{crop.lower()}_{season.lower()}"
        calendar = calendars.get(key, {
            "note": f"Calendar for {crop} ({season}) in {region} not found in database. Contact local KVK.",
            "kvk_contact": "ICAR-KVK Rewa: kvkrewa@gmail.com",
        })

        calendar["region"] = region
        calendar["crop"] = crop
        calendar["season"] = season
        calendar["source"] = "ICAR State Agriculture University + KVK Rewa"
        return calendar