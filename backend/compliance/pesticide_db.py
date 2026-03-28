class PesticideDatabase:
    """
    Based on CIB&RC (Central Insecticides Board & Registration Committee) data.
    India has banned 27 pesticides as of 2023 + restricted several others.
    """

    BANNED_LIST = [
        "Endosulfan",
        "Monocrotophos",
        "Methomyl",
        "Phorate",
        "Phosphamidon",
        "Triazophos",
        "Carbofuran",
        "Methoxy Ethyl Mercuric Chloride",
        "Sodium Cyanide",
        "Aluminium Phosphide",
        "Calcium Cyanide",
        "Ethyl Mercury Chloride",
        "Heptachlor",
        "Chlordane",
        "Dieldrin",
        "Aldrin",
        "Telodrin",
        "Paraquat",
        "Dazomet",
        "Fenarimon",
        "Mephosfolan",
        "Nitrofen",
        "Oxy Demeton Methyl",
        "Para Dichlorobenzene",
        "Dinoseb",
        "Fluoroacetamide",
        "Nicotine Sulphate",
    ]

    RESTRICTED_LIST = [
        "Chlorpyrifos",
        "Acephate",
        "Methyl Parathion",
        "2,4-D",
        "Atrazine",
    ]

    PESTICIDE_DATA = {
        "Chlorpyrifos": {
            "status": "RESTRICTED",
            "phi_days": {"wheat": 15, "rice": 15, "soybean": 21, "default": 21},
            "approved_crops": ["rice", "wheat", "sugarcane", "cotton"],
            "mrl_ppm": {"wheat": 0.01, "rice": 0.01},
            "alternatives": ["Neem oil (Azadirachtin)", "Imidacloprid 17.8 SL", "Thiamethoxam 25 WG"],
            "class": "II",
        },
        "Imidacloprid": {
            "status": "APPROVED",
            "phi_days": {"wheat": 21, "rice": 21, "soybean": 21, "default": 21},
            "approved_crops": ["wheat", "rice", "soybean", "cotton", "sugarcane"],
            "mrl_ppm": {"wheat": 0.05, "rice": 0.05},
            "alternatives": ["Thiamethoxam", "Clothianidin", "Neem-based"],
            "class": "II",
        },
        "Mancozeb": {
            "status": "APPROVED",
            "phi_days": {"wheat": 3, "tomato": 5, "potato": 7, "default": 5},
            "approved_crops": ["wheat", "potato", "tomato", "grapes", "onion"],
            "mrl_ppm": {"wheat": 3.0},
            "alternatives": ["Copper oxychloride", "Propineb", "Carbendazim"],
            "class": "IV",
        },
        "Carbendazim": {
            "status": "APPROVED",
            "phi_days": {"wheat": 3, "rice": 5, "default": 5},
            "approved_crops": ["wheat", "rice", "soybean", "groundnut"],
            "mrl_ppm": {"wheat": 0.1, "rice": 0.1},
            "alternatives": ["Tebuconazole", "Propiconazole", "Trichoderma viride (bio)"],
            "class": "IV",
        },
        "Glyphosate": {
            "status": "RESTRICTED",
            "phi_days": {"default": 30},
            "approved_crops": ["non-crop land", "plantation"],
            "notes": "Not registered for use on food crops in India",
            "alternatives": ["Manual weeding", "Pendimethalin", "Metribuzin"],
            "class": "III",
        },
    }

    ORGANIC_APPROVED = [
        "Neem oil (Azadirachtin 0.03%)",
        "Neem cake",
        "Beauveria bassiana (bio-pesticide)",
        "Trichoderma viride (bio-fungicide)",
        "Pseudomonas fluorescens",
        "NPV (Nuclear Polyhedrosis Virus)",
        "Pheromone traps",
        "Yellow sticky traps",
        "Bordeaux mixture",
        "Copper oxychloride (limited use)",
        "Spinosad (if NPOP approved batch)",
        "Pyrethrum (botanical)",
        "Tobacco extract (nicotine < 0.01%)",
        "Cow urine (Jivamrit)",
        "Dashaparni extract",
    ]

    def check(self, pesticide_name: str, crop: str = None, pest_target: str = None) -> dict:
        name_lower = pesticide_name.lower()

        for banned in self.BANNED_LIST:
            if banned.lower() in name_lower or name_lower in banned.lower():
                return {
                    "name": pesticide_name,
                    "status": "BANNED",
                    "message": f"'{pesticide_name}' is banned in India under the Insecticides Act, 1968.",
                    "authority": "CIB&RC",
                    "alternatives": self.get_alternatives(pesticide_name, crop),
                    "action": "DO NOT USE — suggest alternatives only",
                }

        for restricted in self.RESTRICTED_LIST:
            if restricted.lower() in name_lower:
                return {
                    "name": pesticide_name,
                    "status": "RESTRICTED",
                    "message": f"'{pesticide_name}' has restrictions. Check state-level bans.",
                    "authority": "CIB&RC",
                    "action": "USE WITH CAUTION — verify state registration",
                }

        data = None
        for key in self.PESTICIDE_DATA:
            if key.lower() in name_lower or name_lower in key.lower():
                data = self.PESTICIDE_DATA[key]
                break

        if data:
            phi = data["phi_days"].get(crop, data["phi_days"]["default"]) if crop else data["phi_days"]["default"]
            return {
                "name": pesticide_name,
                "status": data["status"],
                "phi_days": phi,
                "phi_note": f"Do not spray within {phi} days of harvest",
                "toxicity_class": data.get("class", "Unknown"),
                "approved_crops": data.get("approved_crops", []),
                "alternatives": data.get("alternatives", []),
                "mrl": data.get("mrl_ppm", {}).get(crop, "Not specified"),
                "authority": "CIB&RC India",
            }

        return {
            "name": pesticide_name,
            "status": "UNVERIFIED",
            "message": f"'{pesticide_name}' not found in database. Always verify with CIB&RC before use.",
            "action": "Verify registration at cibrc.nic.in",
            "authority": "CIB&RC India",
        }

    def get_alternatives(self, pesticide_name: str, crop: str = None) -> list:
        for key, data in self.PESTICIDE_DATA.items():
            if key.lower() in pesticide_name.lower():
                return data.get("alternatives", self.ORGANIC_APPROVED[:5])
        return [
            "Neem oil (Azadirachtin)",
            "Beauveria bassiana",
            "Trichoderma viride",
            "Sticky traps (for insects)",
            "Bordeaux mixture (for fungi)",
        ]