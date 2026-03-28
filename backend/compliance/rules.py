class ComplianceRules:
    """
    Agricultural compliance rules for India.
    Sources: ICAR, NPOP, CIB&RC, FSSAI MRL tables.
    """

    PHI_RULES = {
        "wheat": {
            "min_spray_window_days_before_harvest": 7,
            "critical_period": "tillering to heading",
            "no_spray_stage": "grain filling and dough stage",
        },
        "rice": {
            "min_spray_window_days_before_harvest": 14,
            "critical_period": "tillering to panicle initiation",
            "no_spray_stage": "milk and dough stage",
        },
        "soybean": {
            "min_spray_window_days_before_harvest": 21,
            "critical_period": "flowering to pod fill",
            "no_spray_stage": "pod maturity",
        },
        "tomato": {
            "min_spray_window_days_before_harvest": 5,
            "critical_period": "vegetative to early fruiting",
            "no_spray_stage": "red ripe stage",
        },
        "gram": {
            "min_spray_window_days_before_harvest": 14,
            "critical_period": "vegetative",
            "no_spray_stage": "pod filling to maturity",
        },
    }

    NPOP_RULES = {
        "conversion_period_years": 2,
        "prohibited_inputs": [
            "All synthetic pesticides",
            "Synthetic chemical fertilizers",
            "Sewage sludge",
            "GMO seeds",
            "Irradiation",
            "Growth hormones",
        ],
        "allowed_inputs": [
            "Farmyard manure",
            "Compost",
            "Vermicompost",
            "Neem-based products",
            "Bio-pesticides (PGPR, Trichoderma, Beauveria)",
            "Pheromone traps",
            "Rock phosphate",
            "Lime",
            "Sulphur (elemental, for pH correction only)",
            "Copper compounds (limited quantities)",
            "Biodynamic preparations",
        ],
        "certification_body_examples": [
            "APEDA", "IMO Control", "OneCert Asia", "Control Union",
            "Ecocert", "SGS India",
        ],
    }

    ICAR_ADVISORY_GUIDELINES = {
        "wheat_rabi": {
            "max_nitrogen_kg_per_ha": 120,
            "split_application": "50% basal, 25% tillering, 25% heading",
            "irrigation_critical_stages": [
                "Crown root initiation (21 DAS)",
                "Tillering (45 DAS)",
                "Jointing (65 DAS)",
                "Flowering (85 DAS)",
                "Grain filling (105 DAS)",
            ],
        },
        "soybean_kharif": {
            "max_nitrogen_kg_per_ha": 30,
            "inoculation": "Rhizobium japonicum + PSB mandatory for new fields",
            "key_pests": ["Yellow mosaic virus (whitefly vector)", "Stem fly", "Girdle beetle"],
        },
        "rice_kharif": {
            "max_nitrogen_kg_per_ha": 100,
            "split_application": "Basal + tillering + PI stage",
            "critical_diseases": ["Blast", "BLB", "Sheath blight"],
        },
    }

    WATER_SPRAY_RESTRICTIONS = {
        "pre_rain_hours": 4,
        "post_rain_hours": 2,
        "wind_speed_max_kmh": 15,
        "temperature_max_celsius": 38,
        "temperature_min_celsius": 15,
        "time_of_day": "Early morning (6-9 AM) or late evening (4-7 PM)",
        "reason": "Avoid spray drift, evaporation loss, and bee mortality during peak foraging hours",
    }

    def get_phi_for_crop(self, crop: str, days_to_harvest: int) -> dict:
        crop_lower = crop.lower()
        rules = self.PHI_RULES.get(crop_lower, {
            "min_spray_window_days_before_harvest": 14,
            "critical_period": "vegetative",
            "no_spray_stage": "near harvest",
        })
        is_in_phi_window = days_to_harvest <= rules["min_spray_window_days_before_harvest"]
        return {
            "crop": crop,
            "days_to_harvest": days_to_harvest,
            "min_phi_days": rules["min_spray_window_days_before_harvest"],
            "is_in_phi_window": is_in_phi_window,
            "no_spray_stage": rules["no_spray_stage"],
            "recommendation": (
                "DO NOT SPRAY — crop is within PHI window" if is_in_phi_window
                else "Spraying permitted — observe PHI for all chemicals used"
            ),
        }

    def get_organic_alternatives(self, crop: str = None) -> list:
        base = [
            "Neem oil (3% Azadirachtin) — 3 ml/litre water",
            "Beauveria bassiana 1.15% WP — 2.5 kg/ha",
            "Trichoderma viride 1% WP — 2.5 kg/ha for soil-borne diseases",
            "Yellow sticky traps — 10 per acre for whitefly/aphids",
            "Pheromone traps — 5 per acre for bollworm/stem borer",
            "Jivamrit spray (fermented cow urine + dung) — 10 litre/acre",
        ]
        crop_specific = {
            "wheat": ["Pseudomonas fluorescens seed treatment", "Trichoderma seed coating"],
            "soybean": ["Rhizobium inoculation", "Pseudomonas seed treatment"],
            "rice": ["Blue-green algae application", "Azolla incorporation"],
            "tomato": ["Bordeaux mixture (1%) for early blight", "NPV for fruit borer"],
        }
        return base + crop_specific.get(crop.lower() if crop else "", [])

    def get_spray_timing_advice(self, temperature_c: float, wind_speed_kmh: float,
                                 rain_probability_percent: float) -> dict:
        restrictions = self.WATER_SPRAY_RESTRICTIONS
        issues = []
        safe = True

        if temperature_c > restrictions["temperature_max_celsius"]:
            issues.append(f"Temperature {temperature_c}°C too high (max {restrictions['temperature_max_celsius']}°C)")
            safe = False
        if wind_speed_kmh > restrictions["wind_speed_max_kmh"]:
            issues.append(f"Wind speed {wind_speed_kmh} km/h too high (max {restrictions['wind_speed_max_kmh']} km/h)")
            safe = False
        if rain_probability_percent > 40:
            issues.append(f"Rain probability {rain_probability_percent}% — spray may wash off")
            safe = False

        return {
            "safe_to_spray": safe,
            "issues": issues,
            "best_time": restrictions["time_of_day"],
            "wait_after_rain_hours": restrictions["post_rain_hours"],
        }