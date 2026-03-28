class SchemesService:
    """
    India agricultural government schemes database.
    Checks eligibility and provides application guidance.
    """

    SCHEMES = {
        "PM-KISAN": {
            "full_name": "Pradhan Mantri Kisan Samman Nidhi",
            "benefit": "₹6,000/year in 3 equal installments of ₹2,000",
            "eligibility": {
                "land_max_acres": None,
                "land_min_acres": None,
                "farmer_type": "all landholding farmers",
                "excluded": ["Government employees", "IT taxpayers", "Constitutional post holders"],
            },
            "how_to_apply": [
                "Visit PM-KISAN portal: pmkisan.gov.in",
                "Click 'New Farmer Registration'",
                "Enter Aadhaar number and mobile number",
                "Fill land details and bank account",
                "Submit and track status",
            ],
            "documents_needed": ["Aadhaar card", "Land records (Khasra/Khatauni)", "Bank account details"],
            "helpline": "155261 / 011-23381092",
            "website": "https://pmkisan.gov.in",
        },
        "PMFBY": {
            "full_name": "Pradhan Mantri Fasal Bima Yojana",
            "benefit": "Crop insurance against natural calamities, pests, diseases",
            "premium_farmer": "2% for Kharif, 1.5% for Rabi, 5% for Horticulture",
            "eligibility": {
                "land_max_acres": None,
                "all_farmers": True,
                "note": "Compulsory for KCC loan holders, optional for others",
            },
            "coverage": ["Drought", "Flood", "Cyclone", "Fire", "Pest & disease", "Landslide"],
            "enrolment_deadlines": {
                "kharif": "July 31",
                "rabi": "December 31",
            },
            "how_to_apply": [
                "Visit nearest bank branch or CSC center",
                "Or apply online at pmfby.gov.in",
                "Provide land details and crop information",
                "Pay small premium (rest subsidized by govt)",
            ],
            "documents_needed": ["Aadhaar", "Land record", "Bank passbook", "Crop sowing certificate"],
            "helpline": "14447",
            "website": "https://pmfby.gov.in",
        },
        "KCC": {
            "full_name": "Kisan Credit Card",
            "benefit": "Revolving credit at 7% interest (4% with prompt repayment). Limit up to ₹3 lakh",
            "eligibility": {
                "all_farmers": True,
                "includes": "Individual/joint borrowers, tenant farmers, oral lessees, SHGs",
            },
            "how_to_apply": [
                "Visit any nationalized bank or cooperative bank",
                "Apply online at banks' website or Jan Samridhi portal",
                "Submit application with required documents",
            ],
            "documents_needed": ["Aadhaar", "Land records", "Passport photo", "No Dues Certificate"],
            "website": "https://www.nabard.org",
        },
        "Soil Health Card": {
            "full_name": "Soil Health Card Scheme (Mitti Swasthya Patra)",
            "benefit": "Free soil testing + personalized fertilizer recommendations",
            "how_to_apply": [
                "Contact nearest Krishi Vigyan Kendra (KVK)",
                "Or apply at soilhealth.dac.gov.in",
                "Your soil will be tested within 3 months",
                "Card valid for 3 years",
            ],
            "website": "https://soilhealth.dac.gov.in",
            "cost": "Free",
        },
        "eNAM": {
            "full_name": "National Agriculture Market",
            "benefit": "Sell produce online to buyers across India — better prices",
            "how_to_apply": [
                "Register at enam.gov.in with Aadhaar and bank details",
                "Bring produce to nearest eNAM mandi",
                "Electronic bidding — best price guaranteed",
            ],
            "website": "https://enam.gov.in",
            "helpline": "1800-270-0224",
        },
        "PKVY": {
            "full_name": "Paramparagat Krishi Vikas Yojana",
            "benefit": "₹50,000/ha over 3 years for organic farming conversion + certification support",
            "eligibility": {
                "group_size_min": 50,
                "min_land_acres": 125,
                "note": "Farmers must form clusters of minimum 50 for 125 acres",
            },
            "how_to_apply": [
                "Form a Farmer Interest Group (FIG) of 50+ farmers",
                "Apply through local agriculture department",
                "NPOP certification support provided",
            ],
            "website": "https://pgsindia-ncof.gov.in",
        },
    }

    def get_schemes(self, state: str = "Madhya Pradesh", land_holding_acres: float = None,
                    crop: str = None, scheme_type: str = "all") -> dict:
        eligible_schemes = []

        filter_map = {
            "income_support": ["PM-KISAN"],
            "insurance": ["PMFBY"],
            "credit": ["KCC"],
            "input_subsidy": ["Soil Health Card", "PKVY"],
            "market": ["eNAM"],
            "all": list(self.SCHEMES.keys()),
        }
        target_schemes = filter_map.get(scheme_type, list(self.SCHEMES.keys()))

        for scheme_name in target_schemes:
            if scheme_name not in self.SCHEMES:
                continue
            scheme = self.SCHEMES[scheme_name]
            eligibility_check = self._check_eligibility(
                scheme_name, scheme, land_holding_acres, state
            )
            eligible_schemes.append({
                "scheme": scheme_name,
                "full_name": scheme.get("full_name"),
                "benefit": scheme.get("benefit"),
                "eligible": eligibility_check["eligible"],
                "eligibility_note": eligibility_check["note"],
                "how_to_apply": scheme.get("how_to_apply", []),
                "documents": scheme.get("documents_needed", []),
                "helpline": scheme.get("helpline", "1800-180-1551 (Kisan Call Center)"),
                "website": scheme.get("website", ""),
            })

        priority_schemes = [s for s in eligible_schemes if s["eligible"]]
        other_schemes = [s for s in eligible_schemes if not s["eligible"]]

        return {
            "state": state,
            "eligible_scheme_count": len(priority_schemes),
            "eligible_schemes": priority_schemes,
            "other_schemes": other_schemes,
            "kisan_call_center": "1800-180-1551 (Toll free, 6 AM to 10 PM)",
            "source": "Ministry of Agriculture & Farmers Welfare, GOI",
        }

    def _check_eligibility(self, name: str, scheme: dict,
                            land_acres: float, state: str) -> dict:
        eligibility = scheme.get("eligibility", {})

        if name == "PM-KISAN":
            if land_acres and land_acres > 0:
                return {"eligible": True, "note": f"Eligible. Land holding: {land_acres} acres"}
            return {"eligible": True, "note": "Eligible if you own agricultural land"}

        if name == "PMFBY":
            return {"eligible": True, "note": "Available for all farmers. Enroll before season deadline."}

        if name == "KCC":
            return {"eligible": True, "note": "Available from all nationalized banks. Apply before sowing."}

        if name == "PKVY":
            return {
                "eligible": False,
                "note": "Requires group of 50+ farmers on 125+ acres. Contact your FPO or agriculture dept."
            }

        return {"eligible": True, "note": "Check eligibility at official website"}