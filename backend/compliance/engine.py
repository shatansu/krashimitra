from compliance.pesticide_db import PesticideDatabase
from compliance.rules import ComplianceRules
from datetime import datetime
import re

pesticide_db = PesticideDatabase()
rules = ComplianceRules()


class ComplianceEngine:
    """
    Enforces agricultural compliance guardrails.
    Every advisory MUST pass through this engine before reaching the farmer.
    """

    def validate_advisory(self, advisory: dict, crop_type: str = None) -> dict:
        flags = []
        safe_alternatives = []
        status = "PASSED"
        warnings = []

        advisory_text = (
            advisory.get("advisory", "") + " " +
            advisory.get("advisory_hindi", "") + " " +
            str(advisory.get("action_steps", []))
        ).lower()

        # ---- CHECK 1: Banned pesticides ----
        for banned in pesticide_db.BANNED_LIST:
            if banned.lower() in advisory_text:
                flags.append(f"BANNED PESTICIDE: '{banned}' is prohibited in India (CIB&RC)")
                status = "BLOCKED"
                alts = pesticide_db.get_alternatives(banned, crop_type)
                safe_alternatives.extend(alts)

        # ---- CHECK 2: PHI window violation ----
        phi_patterns = [
            r"(\d+)\s*day[s]?\s*(before|prior to|before harvest)",
            r"phi[:\s]+(\d+)",
        ]
        for pattern in phi_patterns:
            matches = re.findall(pattern, advisory_text)
            if matches:
                for match in matches:
                    phi_days = int(match[0]) if isinstance(match, tuple) else int(match)
                    if phi_days < 7:
                        warnings.append(
                            f"PHI WARNING: {phi_days}-day interval may be insufficient. "
                            "Verify with CIB&RC label before application."
                        )

        # ---- CHECK 3: Organic farming violation ----
        organic_keywords = ["organic", "jaivik", "npop", "जैविक"]
        synthetic_recommended = self._contains_synthetic_pesticide(advisory_text)
        is_organic_context = any(kw in advisory_text for kw in organic_keywords)

        if is_organic_context and synthetic_recommended:
            flags.append(
                "ORGANIC VIOLATION: Synthetic pesticide suggested for farmer with organic context. "
                "Only NPOP-approved inputs are allowed."
            )
            if status != "BLOCKED":
                status = "BLOCKED"
            safe_alternatives.extend(rules.get_organic_alternatives(crop_type))

        # ---- CHECK 4: Overly high dosage ----
        dosage_issues = self._check_dosage(advisory_text)
        for issue in dosage_issues:
            flags.append(f"DOSAGE WARNING: {issue}")
            if status == "PASSED":
                status = "WARNING"

        # ---- CHECK 5: Missing safety equipment ----
        if self._recommends_chemical(advisory_text):
            safety_keywords = ["gloves", "mask", "dastane", "दस्ताने", "mask", "मास्क",
                               "protective", "suraksha", "सुरक्षा"]
            if not any(kw in advisory_text for kw in safety_keywords):
                warnings.append(
                    "SAFETY: Personal protective equipment (gloves + mask) reminder not included. "
                    "Required for all chemical applications."
                )
                if status == "PASSED":
                    status = "WARNING"

        # ---- CHECK 6: Restricted chemicals needing license ----
        for restricted in pesticide_db.RESTRICTED_LIST:
            if restricted.lower() in advisory_text:
                warnings.append(
                    f"RESTRICTED: '{restricted}' requires valid pesticide license. "
                    "Verify farmer has Class II pesticide authorization."
                )

        all_flags = flags + warnings

        return {
            "status": status,
            "flags": all_flags,
            "safe_alternatives": list(set(safe_alternatives)),
            "checked_at": datetime.utcnow().isoformat(),
            "rules_applied": [
                "CIB&RC_BANNED_LIST",
                "PHI_WINDOW",
                "NPOP_ORGANIC",
                "DOSAGE_LIMITS",
                "PPE_REQUIREMENT",
                "RESTRICTED_CHEMICALS",
            ],
        }

    def check_pesticide(self, name: str) -> dict:
        return pesticide_db.check(name)

    def _contains_synthetic_pesticide(self, text: str) -> bool:
        synthetic_indicators = [
            "chlorpyrifos", "imidacloprid", "lambda", "cypermethrin",
            "mancozeb", "carbendazim", "thiamethoxam", "acephate",
            "profenofos", "quinalphos", "fenvalerate", "deltamethrin",
        ]
        return any(chem in text for chem in synthetic_indicators)

    def _recommends_chemical(self, text: str) -> bool:
        chemical_terms = [
            "spray", "pesticide", "fungicide", "herbicide", "insecticide",
            "chemical", "keetnashak", "कीटनाशक", "dawai", "दवाई",
            "ml per", "gram per", "dose", "application",
        ]
        return any(term in text for term in chemical_terms)

    def _check_dosage(self, text: str) -> list:
        issues = []
        patterns = [
            (r"(\d+)\s*ml\s*per\s*(litre|liter|l\b)", 50, "ml/litre"),
            (r"(\d+)\s*(kg|gm|gram)\s*per\s*acre", 10, "kg/acre"),
        ]
        for pattern, max_val, unit in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    val = float(match[0])
                    if val > max_val:
                        issues.append(
                            f"Dosage of {val} {unit} appears high. "
                            f"Typical max is {max_val} {unit}. Verify label."
                        )
                except ValueError:
                    pass
        return issues